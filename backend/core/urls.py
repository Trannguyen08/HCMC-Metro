from django.urls import path
from core.views import dashboard, media

urlpatterns = [
    path("health/", dashboard.health, name="health"),
    path("admin/stats/", dashboard.admin_stats, name="admin_stats"),
    path("upload/", media.upload_media, name="upload_media"),
]
