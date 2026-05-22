from pydantic import BaseModel
from datetime import datetime


class ReminderCreateRequest(BaseModel):
    document_id: int | None = None
    title: str
    due_at: datetime
    notify_at: datetime


class ReminderUpdateRequest(BaseModel):
    title: str | None = None
    due_at: datetime | None = None
    notify_at: datetime | None = None
    status: str | None = None


class ReminderResponse(BaseModel):
    id: int
    user_id: int
    document_id: int | None
    title: str
    due_at: datetime
    notify_at: datetime
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}
