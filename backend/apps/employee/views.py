from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from .models import Employee
from .serializers import EmployeeSerializer, EmployeeListSerializer
from apps.production.models import ProductionEntry
from django.db.models import Sum, Count, Avg
import datetime


class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'loom_type', 'skill_level']
    search_fields = ['name', 'employee_id', 'loom_number']
    ordering_fields = ['name', 'joining_date', 'employee_id']
    ordering = ['employee_id']

    def get_serializer_class(self):
        if self.action == 'list' and self.request.query_params.get('compact'):
            return EmployeeListSerializer
        return EmployeeSerializer

    # Keep the dropdown response uncached (or very short lived) so that newly created
    # employees appear immediately in form dropdowns.
    @method_decorator(cache_page(5))
    @action(detail=False, methods=['get'], url_path='dropdown')
    def dropdown(self, request):
        """Compact list for form dropdowns."""
        employees = Employee.objects.filter(status='active').values(
            'id', 'employee_id', 'name', 'loom_number', 'loom_type'
        )
        return Response(list(employees))

    @action(detail=True, methods=['get'], url_path='stats')
    def stats(self, request, pk=None):
        """Employee performance stats."""
        employee = self.get_object()
        today = datetime.date.today()
        week_start = today - datetime.timedelta(days=today.weekday())
        month_start = today.replace(day=1)

        entries = ProductionEntry.objects.filter(employee=employee)

        def agg(qs):
            return qs.aggregate(
                total_sarees=Sum('quantity') or 0,
                total_wage=Sum('wage_earned') or 0,
                total_defects=Sum('defects') or 0,
            )

        return Response({
            'employee': EmployeeSerializer(employee).data,
            'all_time': agg(entries),
            'this_month': agg(entries.filter(date__gte=month_start)),
            'this_week': agg(entries.filter(date__gte=week_start)),
            'today': agg(entries.filter(date=today)),
        })
