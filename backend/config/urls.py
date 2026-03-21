from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("apps.users.urls")),
    path("api/", include("apps.news.urls")),
    path("api/", include("apps.metro.urls")),
    path("api/", include("core.urls")),
]
