from rest_framework import serializers
from .models import Salary, SalaryLine, SalaryPayment


class SalaryPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model  = SalaryPayment
        fields = ['id', 'amount', 'payment_method', 'notes', 'paid_on', 'created_at']
        read_only_fields = ['id', 'created_at']


class SalaryLineSerializer(serializers.ModelSerializer):
    saree_type_label = serializers.SerializerMethodField()

    class Meta:
        model  = SalaryLine
        fields = ['id', 'date', 'saree_type', 'saree_type_label',
                  'loom_type', 'saree_length', 'quantity', 'rate', 'subtotal']

    def get_saree_type_label(self, obj):
        return f"{obj.saree_type} ({obj.loom_type} / {obj.saree_length})"


class SalarySerializer(serializers.ModelSerializer):
    employee_name   = serializers.CharField(source='employee.name',        read_only=True)
    employee_code   = serializers.CharField(source='employee.employee_id', read_only=True)
    period_type     = serializers.SerializerMethodField()
    lines           = SalaryLineSerializer(many=True, read_only=True)
    payments        = SalaryPaymentSerializer(many=True, read_only=True)
    status_display  = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model  = Salary
        fields = [
            'id', 'employee', 'employee_name', 'employee_code',
            'period_start', 'period_end', 'period_type',
            'total_sarees', 'total_wage',
            'paid_amount', 'remaining_amount',
            'status', 'status_display',
            'is_paid', 'paid_date',
            'lines', 'payments',
            'created_at', 'updated_at',
        ]

    def get_period_type(self, obj):
        return 'weekly'
