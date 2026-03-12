from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SalaryViewSet

router = DefaultRouter()
router.register('', SalaryViewSet, basename='salary')

urlpatterns = [path('', include(router.urls))]
