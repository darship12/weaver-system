import logging

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from kombu.exceptions import OperationalError
from redis.exceptions import RedisError

from .models import Salary
from .serializers import SalarySerializer
from .tasks import calculate_daily_salary, calculate_weekly_salary_for_employee
import datetime

logger = logging.getLogger(__name__)


class SalaryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Salary.objects.select_related('employee').prefetch_related('lines').all()
    serializer_class = SalarySerializer
    filter_backends = [DjangoFilterBackend]
    # `period_type` does not exist on Salary model; use period_start / period_end if needed.
    filterset_fields = ['employee', 'is_paid']

    @action(detail=False, methods=['post'], url_path='calculate')
    def calculate(self, request):
        """Trigger salary calculation.

        In environments where Celery is not available (e.g., no broker reachable),
        fall back to running the calculation synchronously so the API still works.
        """
        try:
            task = calculate_daily_salary.delay()
            return Response({'task_id': task.id, 'message': 'Salary calculation started.'})
        except (OperationalError, RedisError) as exc:
            logger.warning('Celery broker unavailable, running salary calculation synchronously: %s', exc)
            calculate_daily_salary()
            return Response({'task_id': None, 'message': 'Salary calculated synchronously (no broker available).'})

    @action(detail=False, methods=['get'], url_path='weekly-summary')
    def weekly_summary(self, request):
        today = datetime.date.today()
        week_start = today - datetime.timedelta(days=today.weekday())
        week_end = week_start + datetime.timedelta(days=6)
        # Salary model tracks period_start/period_end; there is no period_type field.
        salaries = Salary.objects.filter(
            period_start=week_start,
            period_end=week_end,
        ).select_related('employee').prefetch_related('lines')
        return Response(SalarySerializer(salaries, many=True).data)

    @action(detail=True, methods=['patch'], url_path='mark-paid')
    def mark_paid(self, request, pk=None):
        salary = self.get_object()
        salary.is_paid = True
        salary.paid_date = datetime.date.today()
        salary.save()
        return Response(SalarySerializer(salary).data)
