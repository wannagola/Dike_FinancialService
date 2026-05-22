from pydantic import BaseModel
from typing import Generic, TypeVar

T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    """모든 API 응답 공통 래퍼 - data + tts 필드 포함"""
    data: T
    tts: str


class ErrorResponse(BaseModel):
    code: str
    message: str
    tts: str
