from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas import ApiResponse
from app.schemas.transaction import TransactionCreateRequest, TransactionResponse
from app.services import transaction_service

router = APIRouter()


@router.get("", response_model=ApiResponse[list[TransactionResponse]])
async def list_transactions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    txs = await transaction_service.get_transactions(current_user, db)
    count = len(txs)
    return ApiResponse(
        data=[TransactionResponse.model_validate(t) for t in txs],
        tts=f"거래 내역이 {count}건 있습니다." if count > 0 else "거래 내역이 없습니다.",
    )


@router.get("/{transaction_id}", response_model=ApiResponse[TransactionResponse])
async def get_transaction(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    tx = await transaction_service.get_transaction(transaction_id, current_user, db)
    return ApiResponse(
        data=TransactionResponse.model_validate(tx),
        tts=f"{tx.amount:,}원 송금 내역입니다. 상태는 {tx.status}입니다.",
    )


@router.post("", response_model=ApiResponse[TransactionResponse], status_code=status.HTTP_201_CREATED)
async def create_transaction(
    req: TransactionCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    tx = await transaction_service.create_transaction(req, current_user, db)
    memo_text = f" 메모: {tx.memo}" if tx.memo else ""
    return ApiResponse(
        data=TransactionResponse.model_validate(tx),
        tts=f"{tx.amount:,}원 송금이 완료되었습니다.{memo_text}",
    )


@router.delete("/{transaction_id}", response_model=ApiResponse[dict])
async def delete_transaction(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await transaction_service.delete_transaction(transaction_id, current_user, db)
    return ApiResponse(data={}, tts="거래 내역이 삭제되었습니다.")
