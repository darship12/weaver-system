from rest_framework import serializers
from .models import ProductionEntry, SareePricing, DesignType


class DesignTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = DesignType
        fields = '__all__'


class SareePricingSerializer(serializers.ModelSerializer):
    profit = serializers.ReadOnlyField()

    class Meta:
        model = SareePricing
        fields = '__all__'


class ProductionEntrySerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.name', read_only=True)
    employee_code = serializers.CharField(source='employee.employee_id', read_only=True)
    design_name = serializers.CharField(source='design_type.name', read_only=True)
    defect_rate = serializers.ReadOnlyField()
    productivity = serializers.ReadOnlyField()

    class Meta:
        model = ProductionEntry
        fields = '__all__'
        read_only_fields = ['wage_earned', 'saree_revenue', 'saree_expense', 'saree_profit', 'created_by']

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class ProductionSummarySerializer(serializers.Serializer):
    total_sarees = serializers.IntegerField()
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_expense = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_profit = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_wage = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_defects = serializers.IntegerField()
    avg_defect_rate = serializers.FloatField()
