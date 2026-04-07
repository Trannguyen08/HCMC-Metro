from django.urls import path
from apps.metro.views import admin, aminity

urlpatterns = [
    path("admin/lines/", admin.admin_metro_lines, name="admin_metro_lines"),
    path("admin/amenity-types/", admin.admin_amenity_types, name="admin_amenity_types"),
    path("admin/amenities/", admin.admin_amenity_list, name="admin_amenity_list"),
    path("admin/amenities/create/", admin.admin_amenity_create, name="admin_amenity_create"),
    path("admin/amenities/<uuid:pk>/", admin.admin_amenity_detail, name="admin_amenity_detail"),
    path("metro/stations/", aminity.station_list, name="station-list"),
    path("metro/amenities/", aminity.amenity_list, name="amenity-list"),
    path("metro/amenities/<uuid:amenity_id>/", aminity.amenity_detail, name="amenity-detail"),
]
