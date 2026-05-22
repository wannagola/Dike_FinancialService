from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from fastapi import HTTPException, status

from app.models.user import User
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from app.schemas.user import UserRegisterRequest, UserLoginRequest, BiometricLoginRequest, BiometricRegisterRequest

MAX_FAILED_ATTEMPTS = 5


async def register_user(req: UserRegisterRequest, db: AsyncSession) -> User:
    result = await db.execute(select(User).where(User.login_id == req.login_id))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "AUTH_010", "message": "이미 사용 중인 아이디입니다.", "tts": "이미 사용 중인 아이디입니다. 다른 아이디를 사용해주세요."},
        )

    user = User(
        login_id=req.login_id,
        password_hash=hash_password(req.password),
        name=req.name,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def login_user(req: UserLoginRequest, db: AsyncSession) -> tuple[str, str]:
    result = await db.execute(select(User).where(User.login_id == req.login_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "AUTH_001", "message": "로그인 정보가 올바르지 않습니다.", "tts": "로그인 정보가 올바르지 않습니다. 다시 시도해주세요."},
        )

    if user.is_locked:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "AUTH_005", "message": "계정이 잠겨 있습니다.", "tts": "계정이 잠겨 있습니다. 관리자에게 문의해주세요."},
        )

    if not verify_password(req.password, user.password_hash):
        new_count = user.failed_count + 1
        is_locked = new_count >= MAX_FAILED_ATTEMPTS
        await db.execute(
            update(User)
            .where(User.id == user.id)
            .values(failed_count=new_count, is_locked=is_locked)
        )
        await db.commit()

        if is_locked:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"code": "AUTH_006", "message": "로그인 시도 초과로 계정이 잠겼습니다.", "tts": "로그인 시도 횟수를 초과하여 계정이 잠겼습니다. 관리자에게 문의해주세요."},
            )

        remaining = MAX_FAILED_ATTEMPTS - new_count
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "AUTH_001", "message": f"로그인 정보가 올바르지 않습니다. ({remaining}회 남음)", "tts": f"로그인 정보가 올바르지 않습니다. {remaining}번 더 실패하면 계정이 잠깁니다."},
        )

    # 로그인 성공 → 실패 횟수 초기화
    await db.execute(update(User).where(User.id == user.id).values(failed_count=0))
    await db.commit()

    return create_access_token(str(user.id)), create_refresh_token(str(user.id))


async def biometric_login(req: BiometricLoginRequest, db: AsyncSession) -> tuple[str, str]:
    result = await db.execute(select(User).where(User.device_id == req.device_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "AUTH_007", "message": "등록된 기기가 아닙니다.", "tts": "등록된 기기가 아닙니다. 일반 로그인을 이용해주세요."},
        )

    if user.is_locked:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "AUTH_005", "message": "계정이 잠겨 있습니다.", "tts": "계정이 잠겨 있습니다. 관리자에게 문의해주세요."},
        )

    return create_access_token(str(user.id)), create_refresh_token(str(user.id))


async def register_biometric(req: BiometricRegisterRequest, user: User, db: AsyncSession) -> None:
    await db.execute(update(User).where(User.id == user.id).values(device_id=req.device_id))
    await db.commit()


async def refresh_tokens(refresh_token: str, redis) -> tuple[str, str]:
    payload = decode_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "AUTH_008", "message": "유효하지 않은 리프레시 토큰입니다.", "tts": "세션이 만료되었습니다. 다시 로그인해주세요."},
        )

    is_blacklisted = await redis.get(f"blacklist:{refresh_token}")
    if is_blacklisted:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "AUTH_009", "message": "이미 사용된 리프레시 토큰입니다.", "tts": "다시 로그인해주세요."},
        )

    user_id = payload["sub"]
    return create_access_token(user_id), create_refresh_token(user_id)


async def unlock_user(login_id: str, password: str, db: AsyncSession) -> None:
    result = await db.execute(select(User).where(User.login_id == login_id))
    user = result.scalar_one_or_none()

    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "AUTH_001", "message": "로그인 정보가 올바르지 않습니다.", "tts": "아이디 또는 비밀번호가 올바르지 않습니다."},
        )

    await db.execute(
        update(User).where(User.id == user.id).values(is_locked=False, failed_count=0)
    )
    await db.commit()


async def logout_user(access_token: str, refresh_token: str | None, redis) -> None:
    from app.core.security import decode_token
    from app.core.config import settings
    import math

    payload = decode_token(access_token)
    if payload:
        exp = payload.get("exp", 0)
        import time
        ttl = max(int(exp - time.time()), 1)
        await redis.setex(f"blacklist:{access_token}", ttl, "1")

    if refresh_token:
        rf_payload = decode_token(refresh_token)
        if rf_payload:
            exp = rf_payload.get("exp", 0)
            import time
            ttl = max(int(exp - time.time()), 1)
            await redis.setex(f"blacklist:{refresh_token}", ttl, "1")
