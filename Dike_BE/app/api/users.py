from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.security import hash_password
from app.schemas import ApiResponse
from app.schemas.user import UserResponse, UserUpdateRequest, FCMTokenRequest
from app.models.user import User

router = APIRouter()


@router.get("/me", response_model=ApiResponse[UserResponse])
async def get_me(current_user: User = Depends(get_current_user)):
    return ApiResponse(
        data=UserResponse.model_validate(current_user),
        tts=f"{current_user.name}님의 정보입니다.",
    )


@router.put("/me", response_model=ApiResponse[UserResponse])
async def update_me(
    req: UserUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    values = {}
    if req.name is not None:
        values["name"] = req.name
    if req.password is not None:
        values["password_hash"] = hash_password(req.password)

    if values:
        await db.execute(update(User).where(User.id == current_user.id).values(**values))
        await db.commit()
        await db.refresh(current_user)

    return ApiResponse(
        data=UserResponse.model_validate(current_user),
        tts="회원 정보가 수정되었습니다.",
    )


@router.post("/me/fcm-token", response_model=ApiResponse[dict])
async def register_fcm_token(
    req: FCMTokenRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await db.execute(update(User).where(User.id == current_user.id).values(fcm_token=req.fcm_token))
    await db.commit()
    return ApiResponse(data={}, tts="푸시 알림이 등록되었습니다.")


@router.delete("/me/fcm-token", response_model=ApiResponse[dict])
async def delete_fcm_token(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await db.execute(update(User).where(User.id == current_user.id).values(fcm_token=None))
    await db.commit()
    return ApiResponse(data={}, tts="푸시 알림이 해제되었습니다.")


@router.delete("/me", status_code=status.HTTP_200_OK, response_model=ApiResponse[dict])
async def delete_me(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await db.execute(delete(User).where(User.id == current_user.id))
    await db.commit()
    return ApiResponse(data={}, tts="회원 탈퇴가 완료되었습니다.")
