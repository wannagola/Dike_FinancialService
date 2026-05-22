from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete

from app.models.account import Account
from app.models.user import User
from app.schemas.account import AccountCreateRequest


def _mask_account_number(number: str) -> str:
    """계좌번호 마스킹: 앞 4자리와 뒤 4자리만 표시."""
    if len(number) <= 8:
        return number
    return number[:4] + "*" * (len(number) - 8) + number[-4:]


async def get_accounts(user: User, db: AsyncSession) -> list[Account]:
    result = await db.execute(
        select(Account).where(Account.user_id == user.id).order_by(Account.is_primary.desc())
    )
    return list(result.scalars().all())


async def get_account(account_id: int, user: User, db: AsyncSession) -> Account:
    result = await db.execute(
        select(Account).where(Account.id == account_id, Account.user_id == user.id)
    )
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "ACC_001", "message": "계좌를 찾을 수 없습니다.", "tts": "해당 계좌를 찾을 수 없습니다."},
        )
    return account


async def create_account(req: AccountCreateRequest, user: User, db: AsyncSession) -> Account:
    # 동일 계좌번호 중복 등록 방지
    existing = await db.execute(
        select(Account).where(Account.user_id == user.id, Account.account_number == req.account_number)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "ACC_002", "message": "이미 등록된 계좌입니다.", "tts": "이미 등록된 계좌번호입니다."},
        )

    # 첫 번째 계좌는 자동으로 대표계좌
    count_result = await db.execute(select(Account).where(Account.user_id == user.id))
    is_first = len(list(count_result.scalars().all())) == 0

    account = Account(
        user_id=user.id,
        bank_code=req.bank_code,
        account_number=req.account_number,
        is_primary=req.is_primary or is_first,
    )
    db.add(account)

    # 대표계좌로 설정 시 기존 대표계좌 해제
    if account.is_primary:
        await db.execute(
            update(Account)
            .where(Account.user_id == user.id)
            .values(is_primary=False)
        )

    await db.commit()
    await db.refresh(account)
    return account


async def set_primary(account_id: int, user: User, db: AsyncSession) -> Account:
    account = await get_account(account_id, user, db)
    await db.execute(
        update(Account).where(Account.user_id == user.id).values(is_primary=False)
    )
    await db.execute(
        update(Account).where(Account.id == account_id).values(is_primary=True)
    )
    await db.commit()
    await db.refresh(account)
    return account


async def delete_account(account_id: int, user: User, db: AsyncSession) -> None:
    account = await get_account(account_id, user, db)
    await db.execute(delete(Account).where(Account.id == account.id))
    await db.commit()


async def update_balance(account_id: int, balance: int, user: User, db: AsyncSession) -> Account:
    account = await get_account(account_id, user, db)
    await db.execute(
        update(Account).where(Account.id == account_id).values(balance_cache=balance)
    )
    await db.commit()
    await db.refresh(account)
    return account
