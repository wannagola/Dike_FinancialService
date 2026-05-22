from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy import select, update

from app.core.database import AsyncSessionLocal
from app.models.reminder import Reminder
from app.models.user import User
from app.services.reminder_service import get_pending_reminders

scheduler = AsyncIOScheduler(timezone="Asia/Seoul")

_firebase_initialized = False


def _init_firebase() -> bool:
    global _firebase_initialized
    if _firebase_initialized:
        return True
    try:
        import firebase_admin
        from firebase_admin import credentials
        from app.core.config import settings
        import os

        if not os.path.exists(settings.FCM_CREDENTIALS_PATH):
            return False

        if not firebase_admin._apps:
            cred = credentials.Certificate(settings.FCM_CREDENTIALS_PATH)
            firebase_admin.initialize_app(cred)

        _firebase_initialized = True
        return True
    except Exception as e:
        print(f"[FCM init error] {e}")
        return False


async def _send_fcm(fcm_token: str, title: str, body: str) -> None:
    if not _init_firebase():
        print(f"[FCM skip] {title}: {body}")
        return
    try:
        from firebase_admin import messaging

        message = messaging.Message(
            notification=messaging.Notification(title=title, body=body),
            token=fcm_token,
        )
        messaging.send(message)
        print(f"[FCM sent] token={fcm_token[:20]}... title={title}")
    except Exception as e:
        print(f"[FCM error] {e}")


async def check_and_send_reminders() -> None:
    """1분마다 실행: 발송 시각이 된 알림을 찾아 FCM 발송 후 상태를 sent로 변경."""
    async with AsyncSessionLocal() as db:
        reminders = await get_pending_reminders(db)
        for reminder in reminders:
            user_result = await db.execute(select(User).where(User.id == reminder.user_id))
            user = user_result.scalar_one_or_none()

            if user and user.fcm_token:
                await _send_fcm(
                    fcm_token=user.fcm_token,
                    title=reminder.title,
                    body=f"납부일이 {reminder.due_at.strftime('%m월 %d일')}입니다. 잊지 마세요!",
                )
            else:
                print(f"[FCM skip] user_id={reminder.user_id} fcm_token 없음")

            await db.execute(
                update(Reminder).where(Reminder.id == reminder.id).values(status="sent")
            )
        if reminders:
            await db.commit()


def start_scheduler() -> None:
    scheduler.add_job(
        check_and_send_reminders,
        trigger=CronTrigger(minute="*"),
        id="reminder_check",
        replace_existing=True,
    )
    scheduler.start()


def stop_scheduler() -> None:
    scheduler.shutdown()
