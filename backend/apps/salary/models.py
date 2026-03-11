from django.db import models
from apps.employee.models import Employee

class Salary(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='salary_records')
    period_start = models.DateField()
    period_end = models.DateField()
    total_sarees = models.PositiveIntegerField(default=0)
    total_wage = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    is_paid = models.BooleanField(default=False)
    paid_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'salary'
        unique_together = ['employee', 'period_start', 'period_end']

class SalaryLine(models.Model):
    salary = models.ForeignKey(Salary, on_delete=models.CASCADE, related_name='lines')
    saree_type = models.CharField(max_length=30)
    loom_type = models.CharField(max_length=10)
    saree_length = models.CharField(max_length=5)
    quantity = models.PositiveIntegerField()
    rate = models.DecimalField(max_digits=8, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        db_table = 'salary_lines'
