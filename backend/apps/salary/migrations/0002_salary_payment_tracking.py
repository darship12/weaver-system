"""
Auto-generated migration for salary app changes.

Run:  python manage.py makemigrations salary
      python manage.py migrate

Or apply the SQL manually if you prefer.

Changes:
  - salary table  : add paid_amount, remaining_amount, status, updated_at
  - salary_lines  : add date column
  - salary_payments (NEW TABLE)
"""
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('salary', '0001_initial'),   # adjust to your last migration
    ]

    operations = [
        # ── 1. salary table new columns ──────────────────────────
        migrations.AddField(
            model_name='salary',
            name='paid_amount',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10),
        ),
        migrations.AddField(
            model_name='salary',
            name='remaining_amount',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10),
        ),
        migrations.AddField(
            model_name='salary',
            name='status',
            field=models.CharField(
                choices=[('unpaid', 'Unpaid'), ('partial', 'Partial'), ('paid', 'Paid')],
                default='unpaid',
                max_length=10,
            ),
        ),
        migrations.AddField(
            model_name='salary',
            name='updated_at',
            field=models.DateTimeField(auto_now=True),
        ),

        # ── 2. salary_lines: add date ─────────────────────────────
        migrations.AddField(
            model_name='salaryline',
            name='date',
            field=models.DateField(blank=True, null=True),
        ),

        # ── 3. new SalaryPayment table ───────────────────────────
        migrations.CreateModel(
            name='SalaryPayment',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('amount', models.DecimalField(decimal_places=2, max_digits=10)),
                ('payment_method', models.CharField(
                    choices=[('UPI', 'UPI'), ('Cash', 'Cash'), ('Bank Transfer', 'Bank Transfer'), ('Cheque', 'Cheque')],
                    default='Cash',
                    max_length=20,
                )),
                ('notes', models.CharField(blank=True, max_length=255)),
                ('paid_on', models.DateField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('salary', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='payments',
                    to='salary.salary',
                )),
            ],
            options={'db_table': 'salary_payments', 'ordering': ['paid_on']},
        ),

        # ── 4. Back-fill remaining_amount for existing rows ───────
        migrations.RunSQL(
            "UPDATE salary SET remaining_amount = total_wage - paid_amount;",
            reverse_sql=migrations.RunSQL.noop,
        ),
        migrations.RunSQL(
            """
            UPDATE salary SET status =
              CASE
                WHEN is_paid = TRUE THEN 'paid'
                WHEN paid_amount > 0 THEN 'partial'
                ELSE 'unpaid'
              END;
            """,
            reverse_sql=migrations.RunSQL.noop,
        ),
    ]
