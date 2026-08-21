"""auth_fields_and_events

Revision ID: a9995a09bc90
Revises: 8b7c712507cb
Create Date: 2026-08-21 00:01:17.166449

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a9995a09bc90'
down_revision: Union[str, Sequence[str], None] = '8b7c712507cb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.get_context().autocommit_block():
        op.execute("ALTER TYPE auditaction ADD VALUE IF NOT EXISTS 'login'")
        op.execute("ALTER TYPE auditaction ADD VALUE IF NOT EXISTS 'login_failed'")
        op.execute("ALTER TYPE auditaction ADD VALUE IF NOT EXISTS 'logout'")
        op.execute("ALTER TYPE auditaction ADD VALUE IF NOT EXISTS 'register'")
        op.execute("ALTER TYPE auditaction ADD VALUE IF NOT EXISTS '2fa_setup'")
        op.execute("ALTER TYPE auditaction ADD VALUE IF NOT EXISTS '2fa_verify_failed'")

    op.add_column('users', sa.Column('failed_attempts', sa.Integer(), server_default=sa.text('0'), nullable=False))
    op.add_column('users', sa.Column('locked_until', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('users', 'locked_until')
    op.drop_column('users', 'failed_attempts')
    # PostgreSQL ENUM ADD VALUE is irreversible, so we skip it.

