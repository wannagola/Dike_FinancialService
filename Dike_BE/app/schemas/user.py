from pydantic import BaseModel, field_validator
from datetime import datetime


class UserRegisterRequest(BaseModel):
    login_id: str
    password: str
    name: str


class UserLoginRequest(BaseModel):
    login_id: str
    password: str


class BiometricLoginRequest(BaseModel):
    device_id: str


class BiometricRegisterRequest(BaseModel):
    device_id: str


class UserUpdateRequest(BaseModel):
    name: str | None = None
    password: str | None = None


class FCMTokenRequest(BaseModel):
    fcm_token: str


class UserResponse(BaseModel):
    id: int
    login_id: str
    name: str
    is_locked: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class UnlockRequest(BaseModel):
    login_id: str
    password: str
