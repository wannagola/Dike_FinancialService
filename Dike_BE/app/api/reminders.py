from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas import ApiResponse
from app.schemas.reminder import ReminderCreateRequest, ReminderUpdateRequest, ReminderResponse
from app.services import reminder_service

router = APIRouter()


@router.get("", response_model=ApiResponse[list[ReminderResponse]])
async def list_reminders(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    reminders = await reminder_service.get_reminders(current_user, db)
    pending = [r for r in reminders if r.status == "pending"]
    count = len(pending)
    return ApiResponse(
        data=[ReminderResponse.model_validate(r) for r in reminders],
        tts=f"대기 중인 알림이 {count}개 있습니다." if count > 0 else "예정된 알림이 없습니다.",
    )


@router.get("/{reminder_id}", response_model=ApiResponse[ReminderResponse])
async def get_reminder(
    reminder_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    reminder = await reminder_service.get_reminder(reminder_id, current_user, db)
    return ApiResponse(
        data=ReminderResponse.model_validate(reminder),
        tts=f"{reminder.title} 알림입니다. 납부일은 {reminder.due_at.strftime('%m월 %d일')}입니다.",
    )


@router.post("", response_model=ApiResponse[ReminderResponse], status_code=status.HTTP_201_CREATED)
async def create_reminder(
    req: ReminderCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    reminder = await reminder_service.create_reminder(req, current_user, db)
    return ApiResponse(
        data=ReminderResponse.model_validate(reminder),
        tts=f"{reminder.title} 알림이 등록되었습니다. {reminder.due_at.strftime('%m월 %d일')} 납부일 전에 알려드릴게요.",
    )


@router.patch("/{reminder_id}", response_model=ApiResponse[ReminderResponse])
async def update_reminder(
    reminder_id: int,
    req: ReminderUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    reminder = await reminder_service.update_reminder(reminder_id, req, current_user, db)
    return ApiResponse(
        data=ReminderResponse.model_validate(reminder),
        tts=f"{reminder.title} 알림이 수정되었습니다.",
    )


@router.delete("/{reminder_id}", response_model=ApiResponse[dict])
async def delete_reminder(
    reminder_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await reminder_service.delete_reminder(reminder_id, current_user, db)
    return ApiResponse(data={}, tts="알림이 삭제되었습니다.")
