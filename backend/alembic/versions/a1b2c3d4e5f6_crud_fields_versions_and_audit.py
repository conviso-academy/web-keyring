"""crud_fields_versions_and_audit

Revision ID: a1b2c3d4e5f6
Revises: a9995a09bc90
Create Date: 2026-08-21 23:05:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = 'a9995a09bc90'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. ENUM values
    with op.get_context().autocommit_block():
        op.execute("ALTER TYPE auditaction ADD VALUE IF NOT EXISTS 'vault_create'")
        op.execute("ALTER TYPE auditaction ADD VALUE IF NOT EXISTS 'vault_update'")
        op.execute("ALTER TYPE auditaction ADD VALUE IF NOT EXISTS 'vault_delete'")

    # 2. Add deleted_at columns
    op.add_column('vaults', sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('secrets', sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True))

    # 3. Add vault_id to audit_log
    op.add_column('audit_log', sa.Column('vault_id', sa.Uuid(), nullable=True))
    
    # 4. FK for vault_id on audit_log
    op.create_foreign_key(
        op.f('fk_audit_log_vault_id_vaults'),
        'audit_log',
        'vaults',
        ['vault_id'],
        ['id'],
        ondelete='SET NULL',
        postgresql_not_valid=True
    )
    op.execute('ALTER TABLE audit_log VALIDATE CONSTRAINT fk_audit_log_vault_id_vaults')

    # 5. Create secret_versions table
    op.create_table('secret_versions',
        sa.Column('id', sa.Uuid(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('secret_id', sa.Uuid(), nullable=False),
        sa.Column('encrypted_value', sa.LargeBinary(), nullable=False),
        sa.Column('version_number', sa.Integer(), nullable=False),
        sa.Column('created_by', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], name=op.f('fk_secret_versions_created_by_users')),
        sa.ForeignKeyConstraint(['secret_id'], ['secrets.id'], name=op.f('fk_secret_versions_secret_id_secrets'), ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_secret_versions')),
        sa.UniqueConstraint('secret_id', 'version_number', name=op.f('uq_secret_versions_secret_id_version'))
    )

    # 6. Create indexes concurrently
    with op.get_context().autocommit_block():
        op.create_index(
            'ix_vaults_active', 
            'vaults', 
            ['owner_id'], 
            postgresql_where=sa.text('deleted_at IS NULL'), 
            postgresql_concurrently=True
        )
        op.create_index(
            'ix_secrets_active', 
            'secrets', 
            ['vault_id'], 
            postgresql_where=sa.text('deleted_at IS NULL'), 
            postgresql_concurrently=True
        )
        op.create_index(
            'ix_audit_log_vault_id',
            'audit_log',
            ['vault_id'],
            postgresql_concurrently=True
        )
        op.create_index(
            'ix_secret_versions_secret_id_version',
            'secret_versions',
            ['secret_id', 'version_number'],
            postgresql_concurrently=True
        )

def downgrade() -> None:
    # 1. Drop concurrent indexes
    with op.get_context().autocommit_block():
        op.drop_index('ix_secret_versions_secret_id_version', table_name='secret_versions', postgresql_concurrently=True)
        op.drop_index('ix_audit_log_vault_id', table_name='audit_log', postgresql_concurrently=True)
        op.drop_index('ix_secrets_active', table_name='secrets', postgresql_concurrently=True)
        op.drop_index('ix_vaults_active', table_name='vaults', postgresql_concurrently=True)

    # 2. Drop secret_versions table
    op.drop_table('secret_versions')

    # 3. Drop FK and column from audit_log
    op.drop_constraint(op.f('fk_audit_log_vault_id_vaults'), 'audit_log', type_='foreignkey')
    op.drop_column('audit_log', 'vault_id')

    # 4. Drop deleted_at columns
    op.drop_column('secrets', 'deleted_at')
    op.drop_column('vaults', 'deleted_at')

    # 5. (PostgreSQL ENUM ADD VALUE is irreversible, so we skip dropping the enum values)
