from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.production.models import SareePricing, DesignType


User = get_user_model()


class Command(BaseCommand):
    help = 'Create default superuser and seed data if empty'

    def handle(self, *args, **options):
        if not User.objects.filter(is_superuser=True).exists():
            user = User.objects.create_superuser('admin', 'admin@weaver.com', 'admin123')
            user.role = 'admin'
            user.save(update_fields=['role'])
            self.stdout.write(self.style.SUCCESS('Created admin user (admin / admin123)'))

        # Seed pricing
        if not SareePricing.objects.exists():
            pricing_data = [
                {'loom_type': '2by1', 'saree_length': '6m', 'saree_type': 'self_saree', 'selling_price': 1300, 'expense': 900, 'employee_wage': 250},
                {'loom_type': '2by1', 'saree_length': '6m', 'saree_type': 'kadiyal', 'selling_price': 1300, 'expense': 900, 'employee_wage': 250},
                {'loom_type': '2by1', 'saree_length': '9m', 'saree_type': 'gothila', 'selling_price': 1800, 'expense': 1000, 'employee_wage': 350},
                {'loom_type': '4by1', 'saree_length': '6m', 'saree_type': 'self_saree', 'selling_price': 1650, 'expense': 1000, 'employee_wage': 300},
                {'loom_type': '4by1', 'saree_length': '6m', 'saree_type': 'kadiyal', 'selling_price': 1650, 'expense': 1000, 'employee_wage': 300},
                {'loom_type': '4by1', 'saree_length': '9m', 'saree_type': 'self_saree', 'selling_price': 2200, 'expense': 1200, 'employee_wage': 400},
            ]
            for p in pricing_data:
                SareePricing.objects.get_or_create(**p)
            self.stdout.write(self.style.SUCCESS('Seeded pricing data'))

        if not DesignType.objects.exists():
            designs = ['Butha', 'Mysore Silk', 'Kadiyal', 'Gothila', 'Self Saree', 'Checks', 'Stripes', 'Floral', 'Border Work', 'Zari Work']
            for d in designs:
                DesignType.objects.get_or_create(name=d)
            self.stdout.write(self.style.SUCCESS('Seeded design types'))
