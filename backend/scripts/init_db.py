#!/usr/bin/env python
"""Initialize database with default data"""
import os, sys, django
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.authentication.models import User
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@weaver.com', 'admin123', role='admin', first_name='System', last_name='Admin')
    print("✓ Admin: admin / admin123")
if not User.objects.filter(username='supervisor1').exists():
    User.objects.create_user('supervisor1', 'supervisor@weaver.com', 'super123', role='supervisor', first_name='Ravi', last_name='Kumar')
    print("✓ Supervisor: supervisor1 / super123")
if not User.objects.filter(username='owner1').exists():
    User.objects.create_user('owner1', 'owner@weaver.com', 'owner123', role='owner', first_name='Mr.', last_name='Owner')
    print("✓ Owner: owner1 / owner123")

from apps.employee.models import Employee
from datetime import date
if not Employee.objects.exists():
    for e in [
        {'name':'Raju Weaver','phone':'9876543210','loom_number':'Loom 01','loom_type':'2by1','skill_level':'senior','joining_date':date(2022,1,15)},
        {'name':'Suresh Kumar','phone':'9876543211','loom_number':'Loom 02','loom_type':'2by1','skill_level':'junior','joining_date':date(2023,3,10)},
        {'name':'Manjunath','phone':'9876543212','loom_number':'Loom 03','loom_type':'4by1','skill_level':'master','joining_date':date(2020,6,1)},
        {'name':'Lakshmi Devi','phone':'9876543213','loom_number':'Loom 04','loom_type':'2by1','skill_level':'junior','joining_date':date(2024,1,5)},
        {'name':'Venkatesh','phone':'9876543214','loom_number':'Loom 05','loom_type':'4by1','skill_level':'senior','joining_date':date(2021,8,20)},
    ]:
        Employee.objects.create(**e)
    print("✓ 5 sample employees created")
print("✓ Init complete")
