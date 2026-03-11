from config.celery import app
import logging
logger = logging.getLogger('apps')

@app.task
def generate_weekly_report():
    logger.info('Generating weekly report...')

@app.task
def generate_monthly_report():
    logger.info('Generating monthly report...')

@app.task
def invalidate_dashboard_cache():
    from django.core.cache import cache
    cache.delete_pattern('*dashboard*')
    logger.info('Dashboard cache invalidated')
