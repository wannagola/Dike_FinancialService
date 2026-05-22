from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api import auth, users, documents, accounts, transactions, reminders
from app.scheduler.reminder_job import start_scheduler, stop_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    start_scheduler()
    yield
    stop_scheduler()


app = FastAPI(
    title=settings.APP_NAME,
    description="시각장애인 금융 접근성 서비스 API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["인증"])
app.include_router(users.router, prefix="/users", tags=["사용자"])
app.include_router(documents.router, prefix="/documents", tags=["문서"])
app.include_router(accounts.router, prefix="/accounts", tags=["계좌"])
app.include_router(transactions.router, prefix="/transactions", tags=["거래"])
app.include_router(reminders.router, prefix="/reminders", tags=["알림"])


@app.get("/")
async def health_check():
    return {
        "status": "ok",
        "service": settings.APP_NAME,
        "tts": "서버가 정상 동작 중입니다.",
    }
