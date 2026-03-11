import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
app = Celery('weaver')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

app.conf.beat_schedule = {
    'calculate-daily-salary': {
        'task': 'apps.salary.tasks.calculate_daily_salary',
        'schedule': crontab(hour=23, minute=0),
    },
    'generate-weekly-report': {
        'task': 'apps.reports.tasks.generate_weekly_report',
        'schedule': crontab(day_of_week=0, hour=23, minute=59),
    },
    'invalidate-dashboard-cache': {
        'task': 'apps.production.tasks.invalidate_dashboard_cache',
        'schedule': 300.0,
    },
    'check-defect-thresholds': {
        'task': 'apps.production.tasks.check_defect_thresholds',
        'schedule': crontab(hour=8, minute=0),
    },
}
