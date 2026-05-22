from pydantic import BaseModel
from datetime import datetime


class TransactionCreateRequest(BaseModel):
    from_account_id: int
    to_account_number: str
    amount: int
    memo: str | None = None


class TransactionResponse(BaseModel):
    id: int
    user_id: int
    from_account_id: int | None
    to_account_number: str
    amount: int
    memo: str | None
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}
