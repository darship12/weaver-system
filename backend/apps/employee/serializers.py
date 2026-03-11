from rest_framework import serializers
from .models import Employee


class EmployeeSerializer(serializers.ModelSerializer):
    loom_type_display = serializers.CharField(source='get_loom_type_display', read_only=True)
    skill_level_display = serializers.CharField(source='get_skill_level_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Employee
        fields = '__all__'
        read_only_fields = ['employee_id', 'created_at', 'updated_at']


class EmployeeListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views and dropdowns."""
    class Meta:
        model = Employee
        fields = ['id', 'employee_id', 'name', 'loom_number', 'loom_type', 'skill_level', 'status']
