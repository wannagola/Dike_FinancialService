from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete

from app.models.transaction import Transaction
from app.models.account import Account
from app.models.user import User
from app.schemas.transaction import TransactionCreateRequest


async def get_transactions(user: User, db: AsyncSession) -> list[Transaction]:
    result = await db.execute(
        select(Transaction)
        .where(Transaction.user_id == user.id)
        .order_by(Transaction.created_at.desc())
    )
    return list(result.scalars().all())


async def get_transaction(transaction_id: int, user: User, db: AsyncSession) -> Transaction:
    result = await db.execute(
        select(Transaction).where(
            Transaction.id == transaction_id,
            Transaction.user_id == user.id,
        )
    )
    tx = result.scalar_one_or_none()
    if not tx:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "TX_001", "message": "거래 내역을 찾을 수 없습니다.", "tts": "해당 거래 내역을 찾을 수 없습니다."},
        )
    return tx


async def create_transaction(req: TransactionCreateRequest, user: User, db: AsyncSession) -> Transaction:
    # 출금 계좌 소유 확인
    acc_result = await db.execute(
        select(Account).where(Account.id == req.from_account_id, Account.user_id == user.id)
    )
    account = acc_result.scalar_one_or_none()
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "TX_002", "message": "출금 계좌를 찾을 수 없습니다.", "tts": "출금 계좌를 찾을 수 없습니다."},
        )

    if account.balance_cache < req.amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "TX_003", "message": "잔액이 부족합니다.", "tts": f"잔액이 부족합니다. 현재 잔액은 {account.balance_cache:,}원입니다."},
        )

    tx = Transaction(
        user_id=user.id,
        from_account_id=req.from_account_id,
        to_account_number=req.to_account_number,
        to_bank_code=req.to_bank_code,
        amount=req.amount,
        memo=req.memo,
        status="completed",
    )
    db.add(tx)

    # 잔액 캐시 차감
    await db.execute(
        update(Account)
        .where(Account.id == account.id)
        .values(balance_cache=account.balance_cache - req.amount)
    )

    await db.commit()
    await db.refresh(tx)
    return tx


async def delete_transaction(transaction_id: int, user: User, db: AsyncSession) -> None:
    tx = await get_transaction(transaction_id, user, db)
    await db.execute(delete(Transaction).where(Transaction.id == tx.id))
    await db.commit()
