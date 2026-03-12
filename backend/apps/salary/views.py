import datetime
import logging

from django.http import HttpResponse
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from kombu.exceptions import OperationalError
from redis.exceptions import RedisError

from .models import Salary, SalaryPayment
from .serializers import SalarySerializer, SalaryPaymentSerializer
from .tasks import calculate_daily_salary

logger = logging.getLogger(__name__)


class SalaryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = (
        Salary.objects
        .select_related('employee')
        .prefetch_related('lines', 'payments')
        .all()
    )
    serializer_class = SalarySerializer
    filter_backends  = [DjangoFilterBackend]
    filterset_fields = ['employee', 'is_paid', 'status']

    # ── Trigger calculation ───────────────────────────────────
    @action(detail=False, methods=['post'], url_path='calculate')
    def calculate(self, request):
        try:
            task = calculate_daily_salary.delay()
            return Response({'task_id': task.id, 'message': 'Salary calculation started.'})
        except (OperationalError, RedisError) as exc:
            logger.warning('Celery unavailable, running synchronously: %s', exc)
            calculate_daily_salary()
            return Response({'task_id': None, 'message': 'Salary calculated synchronously.'})

    # ── Weekly summary for current week ──────────────────────
    @action(detail=False, methods=['get'], url_path='weekly-summary')
    def weekly_summary(self, request):
        today      = datetime.date.today()
        week_start = today - datetime.timedelta(days=today.weekday())
        week_end   = week_start + datetime.timedelta(days=6)
        salaries   = (
            Salary.objects
            .filter(period_start=week_start, period_end=week_end)
            .select_related('employee')
            .prefetch_related('lines', 'payments')
        )
        return Response(SalarySerializer(salaries, many=True).data)

    # ── Summary for any week (date = any day in the week) ─────
    @action(detail=False, methods=['get'], url_path='week-summary')
    def week_summary(self, request):
        """
        GET /salary/week-summary/?date=2026-03-12
        Returns salary records for the week containing `date`.
        """
        date_str = request.query_params.get('date')
        if not date_str:
            return Response({'error': 'date param required (YYYY-MM-DD)'}, status=400)
        try:
            ref_date = datetime.date.fromisoformat(date_str)
        except ValueError:
            return Response({'error': 'Invalid date format'}, status=400)

        week_start = ref_date - datetime.timedelta(days=ref_date.weekday())
        week_end   = week_start + datetime.timedelta(days=6)
        salaries   = (
            Salary.objects
            .filter(period_start=week_start, period_end=week_end)
            .select_related('employee')
            .prefetch_related('lines', 'payments')
        )
        return Response({
            'week_start': str(week_start),
            'week_end':   str(week_end),
            'results':    SalarySerializer(salaries, many=True).data,
        })

    # ── Credit-card style: add a payment installment ─────────
    @action(detail=True, methods=['post'], url_path='add-payment')
    def add_payment(self, request, pk=None):
        """
        POST /salary/{id}/add-payment/
        Body: { amount, payment_method, notes, paid_on }
        """
        salary = self.get_object()

        serializer = SalaryPaymentSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        amount = serializer.validated_data['amount']

        # Guard: can't overpay
        if amount <= 0:
            return Response({'error': 'Amount must be positive.'}, status=400)
        if amount > salary.remaining_amount:
            return Response({
                'error': f'Amount exceeds remaining balance of Rs.{salary.remaining_amount}.'
            }, status=400)

        payment = SalaryPayment.objects.create(
            salary=salary,
            **serializer.validated_data,
        )
        # recalculate_payment_status is called in SalaryPayment.save()

        salary.refresh_from_db()
        return Response({
            'payment': SalaryPaymentSerializer(payment).data,
            'salary':  SalarySerializer(salary).data,
        }, status=status.HTTP_201_CREATED)

    # ── Legacy mark-paid (kept for compatibility) ────────────
    @action(detail=True, methods=['patch'], url_path='mark-paid')
    def mark_paid(self, request, pk=None):
        salary = self.get_object()
        # Create a single full payment
        remaining = salary.remaining_amount
        if remaining > 0:
            SalaryPayment.objects.create(
                salary=salary,
                amount=remaining,
                payment_method=request.data.get('payment_method', 'Cash'),
                notes='Full payment via Mark Paid',
                paid_on=datetime.date.today(),
            )
            salary.refresh_from_db()
        return Response(SalarySerializer(salary).data)

    # ── Download payslip PDF ──────────────────────────────────
    @action(detail=True, methods=['get'], url_path='download-payslip')
    def download_payslip(self, request, pk=None):
        """
        GET /salary/{id}/download-payslip/
        Returns a PDF file.
        """
        from .payslip_generator import generate_payslip_pdf

        salary = (
            Salary.objects
            .select_related('employee')
            .prefetch_related('lines', 'payments')
            .get(pk=pk)
        )

        try:
            pdf_bytes = generate_payslip_pdf(salary)
        except Exception as exc:
            logger.exception('Payslip generation failed: %s', exc)
            return Response({'error': 'Could not generate payslip.'}, status=500)

        emp_id   = salary.employee.employee_id.replace('-', '')
        filename = f"payslip_{emp_id}_{salary.period_start.strftime('%b%Y')}.pdf"

        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
