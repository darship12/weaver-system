from datetime import date, timedelta
from django.db.models import Sum
from apps.production.models import ProductionEntry
from apps.employee.models import Employee
from .models import Salary, SalaryLine
from django.conf import settings
import logging
logger = logging.getLogger(__name__)

def calculate_salary_for_period(employee, start_date, end_date):
    productions = ProductionEntry.objects.filter(
        employee=employee, date__gte=start_date, date__lte=end_date
    ).values('loom_type','saree_length','saree_type').annotate(
        total_qty=Sum('quantity'), total_wage=Sum('wage_earned'))

    total_sarees = sum(p['total_qty'] for p in productions)
    total_wage = sum(float(p['total_wage']) for p in productions)

    salary, _ = Salary.objects.update_or_create(
        employee=employee, period_start=start_date, period_end=end_date,
        defaults={'total_sarees': total_sarees, 'total_wage': total_wage}
    )
    SalaryLine.objects.filter(salary=salary).delete()
    for p in productions:
        pricing = settings.SAREE_PRICING.get((p['loom_type'], p['saree_length'], p['saree_type']), {})
        rate = pricing.get('wage', 0)
        SalaryLine.objects.create(
            salary=salary, saree_type=p['saree_type'], loom_type=p['loom_type'],
            saree_length=p['saree_length'], quantity=p['total_qty'],
            rate=rate, subtotal=p['total_wage']
        )
    return salary

def get_weekly_salary(employee_id):
    today = date.today()
    start = today - timedelta(days=today.weekday())
    try:
        emp = Employee.objects.get(id=employee_id)
        return calculate_salary_for_period(emp, start, today)
    except Employee.DoesNotExist:
        return None
