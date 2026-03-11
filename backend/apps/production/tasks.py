from config.celery import app
import logging
logger = logging.getLogger('apps')

@app.task
def check_defect_thresholds():
    from .models import ProductionEntry
    from django.db.models import Sum
    import datetime
    today = datetime.date.today()
    week_start = today - datetime.timedelta(days=today.weekday())
    entries = ProductionEntry.objects.filter(date__gte=week_start).values(
        'employee__name'
    ).annotate(total=Sum('quantity'), defects=Sum('defects'))
    for e in entries:
        if e['total']:
            rate = (e['defects'] or 0) / e['total'] * 100
            if rate > 10:
                logger.warning(f"High defect rate: {e['employee__name']} = {rate:.1f}%")
