from datetime import datetime, timedelta
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete

from app.models.reminder import Reminder
from app.models.user import User
from app.schemas.reminder import ReminderCreateRequest, ReminderUpdateRequest


def _calc_notify_at(due_at: datetime) -> datetime:
    """납부일 7일 전을 기본 알림 시각으로 설정."""
    notify = due_at - timedelta(days=7)
    now = datetime.utcnow()
    # 이미 7일 전이 지났으면 1일 전으로 조정
    if notify < now:
        notify = due_at - timedelta(days=1)
    # 1일 전도 지났으면 당일 오전 9시
    if notify < now:
        notify = due_at.replace(hour=9, minute=0, second=0, microsecond=0)
    return notify


async def get_reminders(user: User, db: AsyncSession) -> list[Reminder]:
    result = await db.execute(
        select(Reminder)
        .where(Reminder.user_id == user.id)
        .order_by(Reminder.due_at.asc())
    )
    return list(result.scalars().all())


async def get_reminder(reminder_id: int, user: User, db: AsyncSession) -> Reminder:
    result = await db.execute(
        select(Reminder).where(Reminder.id == reminder_id, Reminder.user_id == user.id)
    )
    reminder = result.scalar_one_or_none()
    if not reminder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "REM_001", "message": "알림을 찾을 수 없습니다.", "tts": "해당 알림을 찾을 수 없습니다."},
        )
    return reminder


async def create_reminder(req: ReminderCreateRequest, user: User, db: AsyncSession) -> Reminder:
    notify_at = req.notify_at or _calc_notify_at(req.due_at)

    reminder = Reminder(
        user_id=user.id,
        document_id=req.document_id,
        title=req.title,
        due_at=req.due_at,
        notify_at=notify_at,
        status="pending",
    )
    db.add(reminder)
    await db.commit()
    await db.refresh(reminder)
    return reminder


async def update_reminder(
    reminder_id: int,
    req: ReminderUpdateRequest,
    user: User,
    db: AsyncSession,
) -> Reminder:
    reminder = await get_reminder(reminder_id, user, db)
    values = {k: v for k, v in req.model_dump().items() if v is not None}
    if values:
        await db.execute(update(Reminder).where(Reminder.id == reminder_id).values(**values))
        await db.commit()
        await db.refresh(reminder)
    return reminder


async def delete_reminder(reminder_id: int, user: User, db: AsyncSession) -> None:
    reminder = await get_reminder(reminder_id, user, db)
    await db.execute(delete(Reminder).where(Reminder.id == reminder.id))
    await db.commit()


async def get_pending_reminders(db: AsyncSession) -> list[Reminder]:
    """스케줄러가 발송 대상 알림을 조회할 때 사용."""
    now = datetime.utcnow()
    result = await db.execute(
        select(Reminder).where(
            Reminder.status == "pending",
            Reminder.notify_at <= now,
        )
    )
    return list(result.scalars().all())
