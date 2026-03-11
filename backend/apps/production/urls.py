from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductionEntryViewSet, SareePricingViewSet, DesignTypeViewSet

router = DefaultRouter()
router.register('', ProductionEntryViewSet, basename='production')
router.register('pricing', SareePricingViewSet, basename='pricing')
router.register('designs', DesignTypeViewSet, basename='design')
urlpatterns = [path('', include(router.urls))]
