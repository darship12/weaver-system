from django.db import models
from django.conf import settings
from apps.employee.models import Employee

LOOM_TYPE_CHOICES = [('2by1','2 by 1'),('4by1','4 by 1')]
LENGTH_CHOICES = [('6m','6 Meter'),('9m','9 Meter')]
SAREE_TYPE_CHOICES = [('self_saree','Self Saree'),('kadiyal','Kadiyal'),('gothila','Gothila')]
DESIGN_CHOICES = [('butha','Butha'),('mysore_silk','Mysore Silk'),('checks','Checks'),
    ('stripes','Stripes'),('floral','Floral'),('border_work','Border Work'),('zari_work','Zari Work'),('other','Other')]

class ProductionEntry(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='production_records')
    date = models.DateField()
    loom_number = models.CharField(max_length=20)
    loom_type = models.CharField(max_length=10, choices=LOOM_TYPE_CHOICES)
    saree_length = models.CharField(max_length=5, choices=LENGTH_CHOICES)
    saree_type = models.CharField(max_length=20, choices=SAREE_TYPE_CHOICES)
    design_type = models.ForeignKey(
        'production.DesignType', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='production_entries'
    )
    quantity = models.PositiveIntegerField()
    defects = models.PositiveIntegerField(default=0)
    work_hours = models.DecimalField(max_digits=4, decimal_places=1, default=8.0)
    # Calculated fields
    wage_earned = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    saree_revenue = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    saree_expense = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    saree_profit = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_production_entries',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'production'
        ordering = ['-date', 'employee__employee_id']

    def save(self, *args, **kwargs):
        pricing = settings.SAREE_PRICING.get((self.loom_type, self.saree_length, self.saree_type), {})
        # Don’t pay for defective sarees; only count good output for wage.
        good_qty = max(self.quantity - (self.defects or 0), 0)
        self.wage_earned = good_qty * pricing.get('wage', 0)

        # Revenue/expense/profit are based on total quantity produced (defects do not affect profit here).
        self.saree_revenue = self.quantity * pricing.get('selling', 0)
        self.saree_expense = self.quantity * pricing.get('expense', 0)
        self.saree_profit = self.quantity * pricing.get('profit', 0)
        super().save(*args, **kwargs)

    @property
    def defect_rate(self):
        return round((self.defects / self.quantity * 100), 2) if self.quantity > 0 else 0

    @property
    def productivity(self):
        return round(float(self.quantity) / float(self.work_hours), 2) if self.work_hours > 0 else 0

    def __str__(self):
        return f"{self.employee.name} - {self.date} - {self.quantity} sarees"


class DesignType(models.Model):
    name = models.CharField(max_length=100, unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class SareePricing(models.Model):
    loom_type = models.CharField(max_length=10, choices=LOOM_TYPE_CHOICES)
    saree_length = models.CharField(max_length=5, choices=LENGTH_CHOICES)
    saree_type = models.CharField(max_length=20, choices=SAREE_TYPE_CHOICES)
    selling_price = models.DecimalField(max_digits=10, decimal_places=2)
    expense = models.DecimalField(max_digits=10, decimal_places=2)
    employee_wage = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('loom_type', 'saree_length', 'saree_type')

    @property
    def profit(self):
        return self.selling_price - self.expense

    def __str__(self):
        return f"{self.loom_type} {self.saree_length} {self.saree_type}"


# Backwards-compatible alias for code expecting Production
Production = ProductionEntry
