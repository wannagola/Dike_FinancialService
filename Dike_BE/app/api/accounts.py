from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas import ApiResponse
from app.schemas.account import AccountCreateRequest, AccountResponse
from app.services import account_service

router = APIRouter()

BANK_NAMES = {
    "004": "국민은행", "020": "우리은행", "088": "신한은행",
    "081": "하나은행", "003": "기업은행", "011": "농협은행",
    "089": "케이뱅크", "090": "카카오뱅크", "092": "토스뱅크",
}


def _to_response(account) -> AccountResponse:
    masked = account_service._mask_account_number(account.account_number)
    data = AccountResponse.model_validate(account)
    data.account_number = masked
    return data


@router.get("", response_model=ApiResponse[list[AccountResponse]])
async def list_accounts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    accounts = await account_service.get_accounts(current_user, db)
    count = len(accounts)
    return ApiResponse(
        data=[_to_response(a) for a in accounts],
        tts=f"등록된 계좌가 {count}개 있습니다." if count > 0 else "등록된 계좌가 없습니다.",
    )


@router.get("/{account_id}", response_model=ApiResponse[AccountResponse])
async def get_account(
    account_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    account = await account_service.get_account(account_id, current_user, db)
    bank = BANK_NAMES.get(account.bank_code, account.bank_code)
    return ApiResponse(
        data=_to_response(account),
        tts=f"{bank} 계좌입니다. 잔액은 {account.balance_cache:,}원입니다.",
    )


@router.post("", response_model=ApiResponse[AccountResponse], status_code=status.HTTP_201_CREATED)
async def create_account(
    req: AccountCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    account = await account_service.create_account(req, current_user, db)
    bank = BANK_NAMES.get(account.bank_code, account.bank_code)
    return ApiResponse(
        data=_to_response(account),
        tts=f"{bank} 계좌가 등록되었습니다.",
    )


@router.patch("/{account_id}/primary", response_model=ApiResponse[AccountResponse])
async def set_primary(
    account_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    account = await account_service.set_primary(account_id, current_user, db)
    bank = BANK_NAMES.get(account.bank_code, account.bank_code)
    return ApiResponse(
        data=_to_response(account),
        tts=f"{bank} 계좌가 대표계좌로 설정되었습니다.",
    )


@router.delete("/{account_id}", response_model=ApiResponse[dict])
async def delete_account(
    account_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await account_service.delete_account(account_id, current_user, db)
    return ApiResponse(data={}, tts="계좌가 삭제되었습니다.")
