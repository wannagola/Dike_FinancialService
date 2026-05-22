from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.redis import get_redis
from app.core.security import decode_token
from app.models.user import User

bearer_scheme = HTTPBearer()
bearer_scheme_optional = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
    redis=Depends(get_redis),
) -> User:
    token = credentials.credentials
    payload = decode_token(token)

    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "AUTH_002", "message": "유효하지 않은 토큰입니다.", "tts": "인증이 만료되었습니다. 다시 로그인해주세요."},
        )

    # Redis 블랙리스트 확인 (로그아웃된 토큰)
    is_blacklisted = await redis.get(f"blacklist:{token}")
    if is_blacklisted:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "AUTH_003", "message": "로그아웃된 토큰입니다.", "tts": "다시 로그인해주세요."},
        )

    user_id = int(payload["sub"])
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "AUTH_004", "message": "사용자를 찾을 수 없습니다.", "tts": "사용자 정보를 찾을 수 없습니다."},
        )

    if user.is_locked:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "AUTH_005", "message": "잠긴 계정입니다.", "tts": "계정이 잠겨 있습니다. 관리자에게 문의해주세요."},
        )

    return user


async def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme_optional),
    db: AsyncSession = Depends(get_db),
    redis=Depends(get_redis),
) -> User | None:
    if not credentials:
        return None
    try:
        return await get_current_user(credentials, db, redis)
    except HTTPException:
        return None
