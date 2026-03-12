from config.celery import app
import datetime
import logging

logger = logging.getLogger('apps')


@app.task
def calculate_daily_salary():
    """
    Recalculate salary for ALL active employees for the current week.
    Creates one SalaryLine per ProductionEntry (per day) — NOT aggregated.
    This allows the table to show each day's work as a separate row.
    """
    from apps.production.models import ProductionEntry, SareePricing
    from apps.employee.models import Employee
    from .models import Salary, SalaryLine
    from django.conf import settings
    from config.kafka_producer import produce_event

    today      = datetime.date.today()
    week_start = today - datetime.timedelta(days=today.weekday())
    week_end   = week_start + datetime.timedelta(days=6)

    for employee in Employee.objects.filter(status='active'):
        entries = ProductionEntry.objects.filter(
            employee=employee,
            date__range=[week_start, week_end]
        ).order_by('date')

        if not entries.exists():
            continue

        total_sarees = sum(e.quantity for e in entries)
        total_wage   = sum(e.wage_earned for e in entries)

        salary, created = Salary.objects.update_or_create(
            employee=employee,
            period_start=week_start,
            period_end=week_end,
            defaults={
                'total_sarees': total_sarees,
                'total_wage':   total_wage,
                # Preserve existing payment data — only update wage totals
                'remaining_amount': max(0, total_wage - (
                    Salary.objects.filter(
                        employee=employee,
                        period_start=week_start,
                        period_end=week_end,
                    ).values_list('paid_amount', flat=True).first() or 0
                )),
            },
        )

        # ── Rebuild lines: one per ProductionEntry ───────────
        SalaryLine.objects.filter(salary=salary).delete()
        for entry in entries:
            try:
                pricing = SareePricing.objects.get(
                    loom_type=entry.loom_type,
                    saree_length=entry.saree_length,
                    saree_type=entry.saree_type,
                )
                rate = pricing.employee_wage
            except SareePricing.DoesNotExist:
                rate = entry.wage_earned / entry.quantity if entry.quantity else 0

            SalaryLine.objects.create(
                salary=salary,
                date=entry.date,
                saree_type=entry.saree_type,
                loom_type=entry.loom_type,
                saree_length=entry.saree_length,
                quantity=entry.quantity,
                rate=rate,
                subtotal=entry.wage_earned,
            )

        # Re-sync remaining after total_wage update
        salary.recalculate_payment_status()

        try:
            produce_event(settings.KAFKA_TOPICS['SALARY_CALCULATED'], {
                'employee_id': employee.id,
                'total_wage':  str(total_wage),
            })
        except Exception:
            pass

    logger.info(f'Salary calculation complete for week {week_start}')


@app.task
def calculate_weekly_salary_for_employee(employee_id):
    """Single-employee version of the above."""
    from apps.production.models import ProductionEntry, SareePricing
    from apps.employee.models import Employee
    from .models import Salary, SalaryLine
    from config.kafka_producer import produce_event
    from django.conf import settings

    today      = datetime.date.today()
    week_start = today - datetime.timedelta(days=today.weekday())
    week_end   = week_start + datetime.timedelta(days=6)

    try:
        employee = Employee.objects.get(id=employee_id)
    except Employee.DoesNotExist:
        return

    entries = ProductionEntry.objects.filter(
        employee=employee,
        date__range=[week_start, week_end]
    ).order_by('date')

    if not entries.exists():
        return

    total_sarees = sum(e.quantity for e in entries)
    total_wage   = sum(e.wage_earned for e in entries)

    salary, _ = Salary.objects.update_or_create(
        employee=employee,
        period_start=week_start,
        period_end=week_end,
        defaults={'total_sarees': total_sarees, 'total_wage': total_wage},
    )

    SalaryLine.objects.filter(salary=salary).delete()
    for entry in entries:
        try:
            pricing = SareePricing.objects.get(
                loom_type=entry.loom_type,
                saree_length=entry.saree_length,
                saree_type=entry.saree_type,
            )
            rate = pricing.employee_wage
        except SareePricing.DoesNotExist:
            rate = entry.wage_earned / entry.quantity if entry.quantity else 0

        SalaryLine.objects.create(
            salary=salary,
            date=entry.date,
            saree_type=entry.saree_type,
            loom_type=entry.loom_type,
            saree_length=entry.saree_length,
            quantity=entry.quantity,
            rate=rate,
            subtotal=entry.wage_earned,
        )

    salary.recalculate_payment_status()

    try:
        produce_event(settings.KAFKA_TOPICS['SALARY_CALCULATED'], {
            'employee_id': employee.id,
            'total_wage':  str(total_wage),
        })
    except Exception:
        pass

    logger.info(f'Salary recalculated for employee {employee_id}')
