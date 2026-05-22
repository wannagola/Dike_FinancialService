from fastapi import APIRouter, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.redis import get_redis
from app.core.dependencies import get_current_user
from app.schemas import ApiResponse
from app.schemas.user import (
    UserRegisterRequest, UserLoginRequest,
    BiometricLoginRequest, BiometricRegisterRequest,
    RefreshRequest, TokenResponse, UserResponse, UnlockRequest,
)
from app.services import auth_service
from app.models.user import User

router = APIRouter()
bearer_scheme = HTTPBearer()


@router.post("/register", response_model=ApiResponse[UserResponse], status_code=status.HTTP_201_CREATED)
async def register(req: UserRegisterRequest, db: AsyncSession = Depends(get_db)):
    user = await auth_service.register_user(req, db)
    return ApiResponse(
        data=UserResponse.model_validate(user),
        tts=f"{user.name}님, 회원가입이 완료되었습니다. 로그인해주세요.",
    )


@router.post("/login", response_model=ApiResponse[TokenResponse])
async def login(req: UserLoginRequest, db: AsyncSession = Depends(get_db)):
    access_token, refresh_token = await auth_service.login_user(req, db)
    return ApiResponse(
        data=TokenResponse(access_token=access_token, refresh_token=refresh_token),
        tts="로그인되었습니다. 디케에 오신 것을 환영합니다.",
    )


@router.post("/biometric/login", response_model=ApiResponse[TokenResponse])
async def biometric_login(req: BiometricLoginRequest, db: AsyncSession = Depends(get_db)):
    access_token, refresh_token = await auth_service.biometric_login(req, db)
    return ApiResponse(
        data=TokenResponse(access_token=access_token, refresh_token=refresh_token),
        tts="생체 인증으로 로그인되었습니다.",
    )


@router.post("/biometric/register", response_model=ApiResponse[dict])
async def register_biometric(
    req: BiometricRegisterRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await auth_service.register_biometric(req, current_user, db)
    return ApiResponse(data={}, tts="생체 인증이 등록되었습니다.")


@router.post("/refresh", response_model=ApiResponse[TokenResponse])
async def refresh(req: RefreshRequest, redis=Depends(get_redis)):
    access_token, refresh_token = await auth_service.refresh_tokens(req.refresh_token, redis)
    return ApiResponse(
        data=TokenResponse(access_token=access_token, refresh_token=refresh_token),
        tts="토큰이 갱신되었습니다.",
    )


@router.post("/unlock", response_model=ApiResponse[dict])
async def unlock(req: UnlockRequest, db: AsyncSession = Depends(get_db)):
    await auth_service.unlock_user(req.login_id, req.password, db)
    return ApiResponse(data={}, tts="계정 잠금이 해제되었습니다. 다시 로그인해주세요.")


@router.post("/logout", response_model=ApiResponse[dict])
async def logout(
    req: RefreshRequest,
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    redis=Depends(get_redis),
):
    await auth_service.logout_user(credentials.credentials, req.refresh_token, redis)
    return ApiResponse(data={}, tts="로그아웃되었습니다.")
