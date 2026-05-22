from pydantic import BaseModel
from datetime import datetime


CATEGORY_CODES = {
    "CAT_01": "정기지출 및 납부",
    "CAT_02": "송장/세금계산서",
    "CAT_03": "이체/송금전표",
    "CAT_04": "은행거래내역서",
    "CAT_05": "카드명세서",
    "CAT_06": "보험 관련 서류",
    "CAT_07": "의료비 영수증",
    "CAT_99": "기타",
}


class DocumentCreateRequest(BaseModel):
    title: str
    category_code: str = "CAT_99"
    amount: int | None = None
    due_date: datetime | None = None
    partner_name: str | None = None
    account_number: str | None = None
    raw_text: str | None = None


class DocumentUpdateRequest(BaseModel):
    title: str | None = None
    category_code: str | None = None
    amount: int | None = None
    due_date: datetime | None = None
    partner_name: str | None = None


class DocumentResponse(BaseModel):
    id: int
    user_id: int
    category_code: str
    title: str
    amount: int | None
    due_date: datetime | None
    partner_name: str | None
    account_number: str | None
    s3_url: str | None
    confidence_score: float | None
    created_at: datetime

    model_config = {"from_attributes": True}


class OCRUploadResponse(BaseModel):
    raw_text: str
    category_code: str
    confidence_score: float
    parsed: DocumentCreateRequest
