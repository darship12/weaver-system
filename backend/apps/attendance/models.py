from django.db import models
from apps.employee.models import Employee

class Attendance(models.Model):
    STATUS_CHOICES = [('present','Present'),('absent','Absent'),('half_day','Half Day')]
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='attendance_records')
    date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='present')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'attendance'
        unique_together = ['employee', 'date']
        ordering = ['-date', 'employee__employee_id']

    def __str__(self): return f"{self.employee.name} - {self.date} ({self.status})"
