from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, Count, Avg, F, Q
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.conf import settings
import datetime

from .models import ProductionEntry, SareePricing, DesignType
from .serializers import ProductionEntrySerializer, SareePricingSerializer, DesignTypeSerializer
from config.kafka_producer import produce_event
from apps.salary.tasks import calculate_weekly_salary_for_employee


class ProductionEntryViewSet(viewsets.ModelViewSet):
    # Restrict lookup to numeric IDs so that keywords like "designs" or "pricing"
    # don't accidentally resolve as a primary key and cause a 404.
    lookup_value_regex = r"[0-9]+"

    queryset = ProductionEntry.objects.select_related('employee', 'design_type').all()
    serializer_class = ProductionEntrySerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['date', 'employee', 'loom_type', 'saree_length']
    search_fields = ['employee__name', 'employee__employee_id']
    ordering_fields = ['date', 'quantity', 'wage_earned']
    ordering = ['-date']

    def perform_create(self, serializer):
        entry = serializer.save()
        produce_event(settings.KAFKA_TOPICS['PRODUCTION_CREATED'], {
            'employee_id': entry.employee_id,
            'date': str(entry.date),
            'loom_type': entry.loom_type,
            'saree_type': entry.saree_type,
            'quantity': entry.quantity,
            'defects': entry.defects,
            'wage_earned': str(entry.wage_earned),
        })
        try:
            calculate_weekly_salary_for_employee.delay(entry.employee_id)
        except Exception:
            calculate_weekly_salary_for_employee(entry.employee_id)

    def perform_destroy(self, instance):
        employee_id = instance.employee_id
        super().perform_destroy(instance)
        try:
            calculate_weekly_salary_for_employee.delay(employee_id)
        except Exception:
            calculate_weekly_salary_for_employee(employee_id)

    @action(detail=False, methods=['get'], url_path='summary')
    def summary(self, request):
        today = datetime.date.today()
        period = request.query_params.get('period', 'today')
        employee_id = request.query_params.get('employee')

        if period == 'today':
            start = today
        elif period == 'week':
            start = today - datetime.timedelta(days=today.weekday())
        elif period == 'month':
            start = today.replace(day=1)
        else:
            start = today

        qs = ProductionEntry.objects.filter(date__gte=start)
        if employee_id:
            qs = qs.filter(employee_id=employee_id)

        agg = qs.aggregate(
            total_sarees=Sum('quantity'),
            total_revenue=Sum('saree_revenue'),
            total_expense=Sum('saree_expense'),
            total_profit=Sum('saree_profit'),
            total_wage=Sum('wage_earned'),
            total_defects=Sum('defects'),
        )
        total_qty = agg['total_sarees'] or 1
        total_defects = agg['total_defects'] or 0
        agg['avg_defect_rate'] = round((total_defects / total_qty) * 100, 2)
        return Response(agg)

    @action(detail=False, methods=['get'], url_path='defects')
    def defects(self, request):
        today = datetime.date.today()
        week_start = today - datetime.timedelta(days=today.weekday())
        qs = ProductionEntry.objects.filter(date__gte=week_start)
        data = qs.values('employee__id', 'employee__name', 'employee__employee_id').annotate(
            total_sarees=Sum('quantity'),
            total_defects=Sum('defects'),
        ).order_by('-total_defects')
        return Response(list(data))

    @action(detail=False, methods=['get'], url_path='top-performers')
    def top_performers(self, request):
        today = datetime.date.today()
        week_start = today - datetime.timedelta(days=today.weekday())
        qs = ProductionEntry.objects.filter(date__gte=week_start)
        data = qs.values('employee__id', 'employee__name', 'employee__employee_id').annotate(
            total_sarees=Sum('quantity'),
            total_wage=Sum('wage_earned'),
            total_defects=Sum('defects'),
        ).order_by('-total_sarees')[:10]
        return Response(list(data))

    @action(detail=False, methods=['get'], url_path='daily-chart')
    def daily_chart(self, request):
        today = datetime.date.today()
        days = int(request.query_params.get('days', 7))
        start = today - datetime.timedelta(days=days - 1)
        data = ProductionEntry.objects.filter(date__gte=start).values('date', 'loom_type').annotate(
            total=Sum('quantity'),
            revenue=Sum('saree_revenue'),
        ).order_by('date')
        return Response(list(data))


class SareePricingViewSet(viewsets.ModelViewSet):
    queryset = SareePricing.objects.all()
    serializer_class = SareePricingSerializer


class DesignTypeViewSet(viewsets.ModelViewSet):
    queryset = DesignType.objects.filter(is_active=True)
    serializer_class = DesignTypeSerializer
