from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count
from .models import Attendance
from .serializers import AttendanceSerializer, BulkAttendanceSerializer
from apps.employee.models import Employee
import datetime
from config.kafka_producer import produce_event
from django.conf import settings


class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.select_related('employee').all()
    serializer_class = AttendanceSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['date', 'employee', 'status']

    @action(detail=False, methods=['post'], url_path='bulk')
    def bulk_mark(self, request):
        serializer = BulkAttendanceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        date = serializer.validated_data['date']
        records = serializer.validated_data['records']

        created, updated = 0, 0
        for record in records:
            obj, is_new = Attendance.objects.update_or_create(
                employee_id=record['employee_id'],
                date=date,
                defaults={
                    'status': record['status'],
                    'notes': record.get('notes', ''),
                }
            )
            if is_new:
                created += 1
            else:
                updated += 1
            # Kafka event
            produce_event(settings.KAFKA_TOPICS['ATTENDANCE_CREATED'], {
                'employee_id': record['employee_id'],
                'date': str(date),
                'status': record['status'],
            })

        return Response({'created': created, 'updated': updated, 'date': str(date)})

    @action(detail=False, methods=['get'], url_path='monthly-summary')
    def monthly_summary(self, request):
        year = int(request.query_params.get('year', datetime.date.today().year))
        month = int(request.query_params.get('month', datetime.date.today().month))
        qs = Attendance.objects.filter(date__year=year, date__month=month)
        summary = qs.values('employee__id', 'employee__name', 'employee__employee_id').annotate(
            present=Count('id', filter=__import__('django.db.models', fromlist=['Q']).Q(status='present')),
            absent=Count('id', filter=__import__('django.db.models', fromlist=['Q']).Q(status='absent')),
            half_day=Count('id', filter=__import__('django.db.models', fromlist=['Q']).Q(status='half_day')),
        )
        return Response(list(summary))
