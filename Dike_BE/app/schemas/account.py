from pydantic import BaseModel
from datetime import datetime


class AccountCreateRequest(BaseModel):
    bank_code: str
    account_number: str
    is_primary: bool = False


class AccountResponse(BaseModel):
    id: int
    user_id: int
    bank_code: str
    account_number: str  # masked before returning
    balance_cache: int
    is_primary: bool
    connected_at: datetime

    model_config = {"from_attributes": True}


class AccountSetPrimaryRequest(BaseModel):
    account_id: int
