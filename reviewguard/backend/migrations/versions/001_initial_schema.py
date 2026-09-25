"""Initial schema

Revision ID: 001
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('email', sa.Text, unique=True, nullable=False),
        sa.Column('display_name', sa.Text),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
    )

    op.create_table(
        'repositories',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('owner_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('provider', sa.Text, nullable=False),
        sa.Column('external_repo_id', sa.Text),
        sa.Column('full_name', sa.Text, nullable=False),
        sa.Column('default_branch', sa.Text, nullable=False, server_default='main'),
        sa.Column('connected_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_check_constraint('ck_repositories_provider', 'repositories', "provider IN ('github', 'gitlab', 'local')")

    op.create_table(
        'reviews',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('repository_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('repositories.id'), nullable=False),
        sa.Column('trigger_type', sa.Text, nullable=False),
        sa.Column('pr_url', sa.Text),
        sa.Column('source_branch', sa.Text),
        sa.Column('target_branch', sa.Text),
        sa.Column('diff_hash', sa.Text, nullable=False),
        sa.Column('status', sa.Text, nullable=False, server_default='pending'),
        sa.Column('overall_verdict', sa.Text),
        sa.Column('lines_added', sa.Integer),
        sa.Column('lines_removed', sa.Integer),
        sa.Column('started_at', sa.TIMESTAMP(timezone=True)),
        sa.Column('completed_at', sa.TIMESTAMP(timezone=True)),
    )
    op.create_check_constraint('ck_reviews_trigger_type', 'reviews', "trigger_type IN ('webhook', 'manual_diff', 'cli')")
    op.create_check_constraint('ck_reviews_status', 'reviews', "status IN ('pending', 'running', 'completed', 'failed')")
    op.create_check_constraint('ck_reviews_verdict', 'reviews', "overall_verdict IN ('passed', 'blocked', 'needs_attention')")
    op.create_index('idx_reviews_repo_diff_hash', 'reviews', ['repository_id', 'diff_hash'], unique=True)

    op.create_table(
        'subagent_runs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('review_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('reviews.id'), nullable=False),
        sa.Column('agent_type', sa.Text, nullable=False),
        sa.Column('status', sa.Text, nullable=False, server_default='queued'),
        sa.Column('findings_count', sa.Integer, server_default='0', nullable=False),
        sa.Column('duration_ms', sa.Integer),
        sa.Column('started_at', sa.TIMESTAMP(timezone=True)),
        sa.Column('completed_at', sa.TIMESTAMP(timezone=True)),
    )
    op.create_check_constraint('ck_subagent_runs_agent_type', 'subagent_runs', "agent_type IN ('security', 'correctness', 'performance', 'testing', 'maintainability', 'patch_generator', 'test_runner')")
    op.create_check_constraint('ck_subagent_runs_status', 'subagent_runs', "status IN ('queued', 'running', 'completed', 'timed_out', 'error')")
    op.create_index('idx_subagent_runs_review_id', 'subagent_runs', ['review_id'])

    op.create_table(
        'findings',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('review_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('reviews.id'), nullable=False),
        sa.Column('subagent_run_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('subagent_runs.id'), nullable=False),
        sa.Column('category', sa.Text, nullable=False),
        sa.Column('severity', sa.Text, nullable=False),
        sa.Column('cwe_ref', sa.Text),
        sa.Column('file_path', sa.Text, nullable=False),
        sa.Column('line_start', sa.Integer, nullable=False),
        sa.Column('line_end', sa.Integer, nullable=False),
        sa.Column('explanation', sa.Text, nullable=False),
        sa.Column('confidence', sa.Numeric(3, 2), nullable=False),
        sa.Column('is_duplicate_of', sa.Boolean, server_default='false', nullable=False),
        sa.Column('duplicate_of_finding_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('findings.id')),
        sa.Column('status', sa.Text, nullable=False, server_default='open'),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_check_constraint('ck_findings_category', 'findings', "category IN ('security', 'correctness', 'performance', 'testing', 'maintainability')")
    op.create_check_constraint('ck_findings_severity', 'findings', "severity IN ('critical', 'high', 'medium', 'low', 'info')")
    op.create_check_constraint('ck_findings_confidence', 'findings', 'confidence >= 0 AND confidence <= 1')
    op.create_check_constraint('ck_findings_status', 'findings', "status IN ('open', 'patched', 'verified', 'dismissed', 'false_positive')")
    op.create_index('idx_findings_review_severity', 'findings', ['review_id', 'severity'])

    op.create_table(
        'patches',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('finding_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('findings.id'), unique=True, nullable=False),
        sa.Column('diff_content', sa.Text, nullable=False),
        sa.Column('status', sa.Text, nullable=False, server_default='suggested'),
        sa.Column('tests_passed', sa.Boolean),
        sa.Column('generated_at', sa.TIMESTAMP(timezone=True)),
        sa.Column('applied_at', sa.TIMESTAMP(timezone=True)),
    )
    op.create_check_constraint('ck_patches_status', 'patches', "status IN ('suggested', 'applied', 'verified', 'failed')")

    op.create_table(
        'test_results',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('patch_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('patches.id'), nullable=False),
        sa.Column('test_command', sa.Text, nullable=False),
        sa.Column('tests_passed', sa.Integer),
        sa.Column('tests_failed', sa.Integer),
        sa.Column('failure_detail', sa.Text),
        sa.Column('run_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
    )

    op.create_table(
        'rules_config',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('repository_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('repositories.id'), unique=True, nullable=False),
        sa.Column('category_toggles', postgresql.JSONB, nullable=False, server_default=sa.text("'{\"security\": true, \"correctness\": true, \"performance\": true, \"testing\": true, \"maintainability\": true}'::jsonb")),
        sa.Column('blocking_severity_threshold', sa.Text, nullable=False, server_default='high'),
        sa.Column('ignored_paths', postgresql.JSONB, nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True)),
    )

    op.create_table(
        'finding_actions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('finding_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('findings.id'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('action_type', sa.Text, nullable=False),
        sa.Column('reason', sa.Text),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_check_constraint('ck_finding_actions_action_type', 'finding_actions', "action_type IN ('dismiss', 'mark_false_positive', 'apply_patch', 'comment')")


def downgrade() -> None:
    op.drop_table('finding_actions')
    op.drop_table('rules_config')
    op.drop_table('test_results')
    op.drop_table('patches')
    op.drop_index('idx_findings_review_severity', table_name='findings')
    op.drop_table('findings')
    op.drop_index('idx_subagent_runs_review_id', table_name='subagent_runs')
    op.drop_table('subagent_runs')
    op.drop_index('idx_reviews_repo_diff_hash', table_name='reviews')
    op.drop_table('reviews')
    op.drop_table('repositories')
    op.drop_table('users')