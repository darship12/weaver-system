from config.celery import app
from django.db.models import Sum
import datetime
import logging
logger = logging.getLogger('apps')


@app.task
def calculate_daily_salary():
    from apps.production.models import ProductionEntry
    from apps.employee.models import Employee
    from .models import Salary, SalaryLine
    from django.conf import settings
    from config.kafka_producer import produce_event

    today = datetime.date.today()
    week_start = today - datetime.timedelta(days=today.weekday())
    week_end = week_start + datetime.timedelta(days=6)

    for employee in Employee.objects.filter(status='active'):
        entries = ProductionEntry.objects.filter(
            employee=employee, date__range=[week_start, week_end]
        )
        if not entries.exists():
            continue
        total = entries.aggregate(sarees=Sum('quantity'), wage=Sum('wage_earned'))
        salary, _ = Salary.objects.update_or_create(
            employee=employee,
            period_start=week_start, period_end=week_end,
            defaults={'total_sarees': total['sarees'] or 0, 'total_wage': total['wage'] or 0},
        )
        # Lines by type
        SalaryLine.objects.filter(salary=salary).delete()
        breakdown = entries.values('saree_type', 'saree_length', 'loom_type').annotate(
            qty=Sum('quantity'), wage=Sum('wage_earned')
        )
        for b in breakdown:
            from apps.production.models import SareePricing
            try:
                pricing = SareePricing.objects.get(
                    loom_type=b['loom_type'], saree_length=b['saree_length'], saree_type=b['saree_type']
                )
                SalaryLine.objects.create(
                    salary=salary,
                    saree_type=b['saree_type'],
                    loom_type=b['loom_type'],
                    saree_length=b['saree_length'],
                    quantity=b['qty'],
                    rate=pricing.employee_wage,
                    subtotal=b['wage'],
                )
            except SareePricing.DoesNotExist:
                pass

        produce_event(settings.KAFKA_TOPICS['SALARY_CALCULATED'], {
            'employee_id': employee.id, 'total_wage': str(total['wage'] or 0)
        })
    logger.info(f'Salary calculation complete for week {week_start}')


def calculate_weekly_salary_for_employee(employee_id):
    pass
