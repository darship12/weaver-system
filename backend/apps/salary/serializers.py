from rest_framework import serializers
from .models import Salary, SalaryLine


class SalaryLineSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalaryLine
        fields = '__all__'


class SalarySerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.name', read_only=True)
    employee_code = serializers.CharField(source='employee.employee_id', read_only=True)
    period_type = serializers.SerializerMethodField()
    lines = SalaryLineSerializer(many=True, read_only=True)

    class Meta:
        model = Salary
        fields = '__all__'

    def get_period_type(self, obj):
        # Currently only weekly summaries are supported.
        return 'weekly'
