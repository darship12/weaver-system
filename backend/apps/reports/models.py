from django.conf import settings
from django.db import models


class Report(models.Model):
    TYPE_CHOICES = [('daily', 'Daily'), ('weekly', 'Weekly'), ('monthly', 'Monthly'), ('custom', 'Custom')]
    FORMAT_CHOICES = [('pdf', 'PDF'), ('excel', 'Excel')]

    report_type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    format = models.CharField(max_length=10, choices=FORMAT_CHOICES, default='pdf')
    period_start = models.DateField()
    period_end = models.DateField()
    file_url = models.URLField(blank=True)
    file_name = models.CharField(max_length=200, blank=True)
    generated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'reports'
        ordering = ['-created_at']
