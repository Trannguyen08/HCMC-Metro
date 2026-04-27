from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

from apps.news.views import news as news_views
from apps.metro.views import admin as metro_admin_views

urlpatterns = [
    path("admin/", admin.site.urls),

    # Combined Admin API Map
    path("api/admin/news/", news_views.admin_news_list, name="admin_api_news_list"),
    path("api/admin/news/create/", news_views.admin_news_create, name="admin_api_news_create"),
    path("api/admin/news/<uuid:pk>/", news_views.admin_news_detail, name="admin_api_news_detail"),

    path("api/admin/amenity-types/", metro_admin_views.admin_amenity_types, name="admin_api_amenity_types"),
    path("api/admin/amenities/", metro_admin_views.admin_amenity_list, name="admin_api_amenity_list"),
    path("api/admin/amenities/create/", metro_admin_views.admin_amenity_create, name="admin_api_amenity_create"),
    path("api/admin/amenities/<uuid:pk>/", metro_admin_views.admin_amenity_detail, name="admin_api_amenity_detail"),

    path("api/admin/stations/", metro_admin_views.admin_station_list, name="admin_api_station_list"),
    path("api/admin/stations/<int:pk>/", metro_admin_views.admin_station_detail, name="admin_api_station_detail"),
    path("api/admin/bus-stops/", metro_admin_views.admin_bus_stop_list, name="admin_api_bus_stop_list"),
    path("api/admin/bus-stops/<int:pk>/", metro_admin_views.admin_bus_stop_detail, name="admin_api_bus_stop_detail"),
    path("api/admin/trains/", metro_admin_views.admin_train_list, name="admin_api_train_list"),
    path("api/admin/trains/<int:pk>/", metro_admin_views.admin_train_detail, name="admin_api_train_detail"),

    # App-specific APIs
    path("api/", include("apps.users.urls")),
    path("api/metro/", include("apps.metro.urls")),
    path("api/news/", include("apps.news.urls")),
    path("api/ticketing/", include("apps.ticketing.urls")),
    path("api/payments/", include("apps.payments.urls")),
    path("api/chatbox/", include("apps.chatbox.urls")),
    path("api/feedback/", include("apps.feedback.urls")),
    path("api/", include("apps.metro.urls")),
    path("api/", include("core.urls")),

    # OpenAPI schema and Swagger/Redoc UI
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/schema/swagger-ui/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    path(
        "api/schema/redoc/",
        SpectacularRedocView.as_view(url_name="schema"),
        name="redoc",
    ),
]
