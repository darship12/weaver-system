from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/auth/', include('apps.authentication.urls')),
    path('api/v1/employees/', include('apps.employee.urls')),
    path('api/v1/attendance/', include('apps.attendance.urls')),
    path('api/v1/production/', include('apps.production.urls')),
    path('api/v1/salary/', include('apps.salary.urls')),
    path('api/v1/reports/', include('apps.reports.urls')),
    path('api/v1/dashboard/', include('apps.reports.dashboard_urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
