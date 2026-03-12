from django.db import models
from apps.employee.models import Employee


class Salary(models.Model):
    STATUS_UNPAID  = 'unpaid'
    STATUS_PARTIAL = 'partial'
    STATUS_PAID    = 'paid'
    STATUS_CHOICES = [
        (STATUS_UNPAID,  'Unpaid'),
        (STATUS_PARTIAL, 'Partial'),
        (STATUS_PAID,    'Paid'),
    ]

    employee     = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='salary_records')
    period_start = models.DateField()
    period_end   = models.DateField()
    total_sarees = models.PositiveIntegerField(default=0)
    total_wage   = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # ── Credit-card-style payment tracking ────────────────────
    paid_amount      = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    remaining_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status           = models.CharField(max_length=10, choices=STATUS_CHOICES, default=STATUS_UNPAID)

    # Legacy — kept for backward compat but derived from status now
    is_paid   = models.BooleanField(default=False)
    paid_date = models.DateField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table        = 'salary'
        unique_together = ['employee', 'period_start', 'period_end']
        ordering        = ['-period_start', 'employee__name']

    def __str__(self):
        return f"{self.employee.name} | {self.period_start} → {self.period_end} | {self.status}"

    def recalculate_payment_status(self):
        """Called after every SalaryPayment is added."""
        from decimal import Decimal
        self.paid_amount      = sum(p.amount for p in self.payments.all())
        self.remaining_amount = max(Decimal('0'), self.total_wage - self.paid_amount)

        if self.remaining_amount == 0 and self.paid_amount > 0:
            self.status   = self.STATUS_PAID
            self.is_paid  = True
            self.paid_date = self.payments.order_by('-paid_on').first().paid_on
        elif self.paid_amount > 0:
            self.status  = self.STATUS_PARTIAL
            self.is_paid = False
        else:
            self.status  = self.STATUS_UNPAID
            self.is_paid = False

        self.save(update_fields=['paid_amount', 'remaining_amount', 'status', 'is_paid', 'paid_date', 'updated_at'])


class SalaryLine(models.Model):
    """One row per production entry (per day), NOT aggregated."""
    salary       = models.ForeignKey(Salary, on_delete=models.CASCADE, related_name='lines')
    date         = models.DateField(null=True, blank=True)   # production date
    saree_type   = models.CharField(max_length=30)
    loom_type    = models.CharField(max_length=10)
    saree_length = models.CharField(max_length=5)
    quantity     = models.PositiveIntegerField()
    rate         = models.DecimalField(max_digits=8, decimal_places=2)
    subtotal     = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        db_table = 'salary_lines'
        ordering = ['date']

    def __str__(self):
        return f"{self.date} | {self.saree_type} | qty={self.quantity}"


class SalaryPayment(models.Model):
    """Individual payment installment — credit-card bill style."""
    METHOD_UPI      = 'UPI'
    METHOD_CASH     = 'Cash'
    METHOD_BANK     = 'Bank Transfer'
    METHOD_CHEQUE   = 'Cheque'
    METHOD_CHOICES  = [
        (METHOD_UPI,    'UPI'),
        (METHOD_CASH,   'Cash'),
        (METHOD_BANK,   'Bank Transfer'),
        (METHOD_CHEQUE, 'Cheque'),
    ]

    salary         = models.ForeignKey(Salary, on_delete=models.CASCADE, related_name='payments')
    amount         = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=METHOD_CHOICES, default=METHOD_CASH)
    notes          = models.CharField(max_length=255, blank=True)
    paid_on        = models.DateField()
    created_at     = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'salary_payments'
        ordering = ['paid_on']

    def __str__(self):
        return f"{self.salary.employee.name} | {self.paid_on} | {self.amount} | {self.payment_method}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.salary.recalculate_payment_status()
