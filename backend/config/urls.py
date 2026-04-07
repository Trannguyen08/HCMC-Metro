from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("apps.users.urls")),
    path("api/metro/", include("apps.metro.urls")),
    path("api/news/", include("apps.news.urls")),
    path("api/ticketing/", include("apps.ticketing.urls")),
    path("api/payments/", include("apps.payments.urls")),
    path("api/", include("apps.users.urls")),
    path("api/", include("core.urls")),
]

