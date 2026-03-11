from rest_framework import viewsets, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action
from django.db.models import Sum, Count, Q
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
import datetime
from .models import Report
from apps.production.models import ProductionEntry
from apps.attendance.models import Attendance
from apps.employee.models import Employee
from apps.salary.models import Salary


class DashboardSummaryView(APIView):
    # Cache dashboard summary briefly for performance but keep it responsive to changes.
    @method_decorator(cache_page(30))
    def get(self, request):
        today = datetime.date.today()
        week_start = today - datetime.timedelta(days=today.weekday())
        month_start = today.replace(day=1)

        total_employees = Employee.objects.filter(status='active').count()

        today_prod = ProductionEntry.objects.filter(date=today).aggregate(
            sarees=Sum('quantity'), revenue=Sum('saree_revenue'), profit=Sum('saree_profit')
        )
        week_prod = ProductionEntry.objects.filter(date__gte=week_start).aggregate(
            sarees=Sum('quantity'), revenue=Sum('saree_revenue'), profit=Sum('saree_profit')
        )
        month_prod = ProductionEntry.objects.filter(date__gte=month_start).aggregate(
            sarees=Sum('quantity'), revenue=Sum('saree_revenue'), profit=Sum('saree_profit')
        )

        # Today's attendance
        today_attendance = Attendance.objects.filter(date=today).aggregate(
            present=Count('id', filter=Q(status='present')),
            absent=Count('id', filter=Q(status='absent')),
        )

        # Top performers this week
        top_performers = ProductionEntry.objects.filter(date__gte=week_start)\
            .values('employee__id', 'employee__name', 'employee__employee_id')\
            .annotate(total_sarees=Sum('quantity'), total_wage=Sum('wage_earned'))\
            .order_by('-total_sarees')[:5]

        # Daily chart (last 7 days)
        daily_chart = []
        for i in range(6, -1, -1):
            d = today - datetime.timedelta(days=i)
            p = ProductionEntry.objects.filter(date=d).aggregate(
                sarees=Sum('quantity'), revenue=Sum('saree_revenue')
            )
            daily_chart.append({
                'date': str(d), 'day': d.strftime('%a'),
                'sarees': p['sarees'] or 0, 'revenue': float(p['revenue'] or 0)
            })

        return Response({
            'total_employees': total_employees,
            'today': {
                'sarees': today_prod['sarees'] or 0,
                'revenue': float(today_prod['revenue'] or 0),
                'profit': float(today_prod['profit'] or 0),
                'present': today_attendance['present'],
                'absent': today_attendance['absent'],
            },
            'this_week': {
                'sarees': week_prod['sarees'] or 0,
                'revenue': float(week_prod['revenue'] or 0),
                'profit': float(week_prod['profit'] or 0),
            },
            'this_month': {
                'sarees': month_prod['sarees'] or 0,
                'revenue': float(month_prod['revenue'] or 0),
                'profit': float(month_prod['profit'] or 0),
            },
            'top_performers': list(top_performers),
            'daily_chart': daily_chart,
        })
