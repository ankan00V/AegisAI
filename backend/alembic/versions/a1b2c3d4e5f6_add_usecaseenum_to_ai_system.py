"""add use case enum

Revision ID: a1b2c3d4e5f6
Revises: 85d6d890e592
Create Date: 2026-05-15 12:45:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = '85d6d890e592'
branch_labels = None
depends_on = None

def upgrade():
    # Create the UseCaseEnum type in PostgreSQL
    use_case_enum = postgresql.ENUM(
        'cv_screening',
        'credit_scoring',
        'medical_diagnosis',
        'fraud_detection',
        'content_moderation',
        'predictive_policing',
        'student_assessment',
        'candidate_ranking',
        'risk_assessment',
        'customer_service',
        'other',
        name='usecaseenum'
    )
    use_case_enum.create(op.get_bind())

    # Alter the use_case column to use the new Enum type with explicit casting
    op.execute("ALTER TABLE ai_systems ALTER COLUMN use_case TYPE usecaseenum USING use_case::text::usecaseenum")


def downgrade():
    # Alter the use_case column back to String
    op.execute("ALTER TABLE ai_systems ALTER COLUMN use_case TYPE VARCHAR(255)")
    
    # Drop the Enum type
    use_case_enum = postgresql.ENUM(name='usecaseenum')
    use_case_enum.drop(op.get_bind())
