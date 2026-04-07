from django.urls import path
from apps.metro.views import admin

urlpatterns = [
    path("admin/lines/", admin.admin_metro_lines, name="admin_metro_lines"),
]
