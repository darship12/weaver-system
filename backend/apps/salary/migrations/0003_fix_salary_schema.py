"""Fix salary schema in cases where migration 0002 was faked/partially applied.

This migration ensures the missing columns exist and that the salary_payments
columns match the current models.
"""

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("salary", "0002_salary_payment_tracking"),
    ]

    operations = [
        # Ensure expected columns exist on salary (safe to run multiple times).
        migrations.RunSQL(
            sql="""
                ALTER TABLE salary ADD COLUMN IF NOT EXISTS paid_amount numeric(10,2) NOT NULL DEFAULT 0;
                ALTER TABLE salary ADD COLUMN IF NOT EXISTS remaining_amount numeric(10,2) NOT NULL DEFAULT 0;
                ALTER TABLE salary ADD COLUMN IF NOT EXISTS status varchar(10) NOT NULL DEFAULT 'unpaid';
            """,
            reverse_sql=migrations.RunSQL.noop,
        ),

        # Backfill derived fields (no-op if already correct).
        migrations.RunSQL(
            sql="""
                UPDATE salary
                SET remaining_amount = total_wage - paid_amount
                WHERE remaining_amount IS NULL;

                UPDATE salary
                SET status =
                  CASE
                    WHEN is_paid = TRUE THEN 'paid'
                    WHEN paid_amount > 0 THEN 'partial'
                    ELSE 'unpaid'
                  END
                WHERE status IS NULL OR status = '';
            """,
            reverse_sql=migrations.RunSQL.noop,
        ),

        # Align salary_payments column names with the model schema.
        migrations.RunSQL(
            sql="""
                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_name = 'salary_payments' AND column_name = 'method'
                    ) THEN
                        ALTER TABLE salary_payments RENAME COLUMN method TO payment_method;
                    END IF;

                    IF EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_name = 'salary_payments' AND column_name = 'note'
                    ) THEN
                        ALTER TABLE salary_payments RENAME COLUMN note TO notes;
                    END IF;
                END
                $$;
            """,
            reverse_sql=migrations.RunSQL.noop,
        ),
    ]
