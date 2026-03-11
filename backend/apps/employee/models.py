from django.db import models

class Employee(models.Model):
    SKILL_CHOICES = [('trainee','Trainee'),('junior','Junior'),('senior','Senior'),('master','Master')]
    STATUS_CHOICES = [('active','Active'),('inactive','Inactive')]
    LOOM_TYPE_CHOICES = [('2by1','2 by 1'),('4by1','4 by 1')]

    employee_id = models.CharField(max_length=20, unique=True, editable=False)
    name = models.CharField(max_length=100)
    phone = models.CharField(max_length=15, blank=True)
    address = models.TextField(blank=True)
    skill_level = models.CharField(max_length=20, choices=SKILL_CHOICES, default='junior')
    loom_number = models.CharField(max_length=20)
    loom_type = models.CharField(max_length=10, choices=LOOM_TYPE_CHOICES, default='2by1')
    joining_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'employees'
        ordering = ['employee_id']

    def save(self, *args, **kwargs):
        if not self.employee_id:
            last = Employee.objects.order_by('id').last()
            num = (last.id + 1) if last else 1
            self.employee_id = f'EMP-{num:04d}'
        super().save(*args, **kwargs)

    def __str__(self): return f"{self.employee_id} - {self.name}"
