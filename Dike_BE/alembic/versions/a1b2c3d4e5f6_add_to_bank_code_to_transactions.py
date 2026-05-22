"""add_to_bank_code_to_transactions

Revision ID: a1b2c3d4e5f6
Revises: d02f95ef9949
Create Date: 2026-05-23 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = 'd02f95ef9949'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('transactions', sa.Column('to_bank_code', sa.String(length=10), nullable=True))


def downgrade() -> None:
    op.drop_column('transactions', 'to_bank_code')
