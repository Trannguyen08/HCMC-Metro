from django.urls import path
from apps.metro.views import admin, aminity

urlpatterns = [
    path("admin/lines/", admin.admin_metro_lines, name="admin_metro_lines"),
    path("metro/stations/", aminity.station_list, name="station-list"),
    path("metro/amenities/", aminity.amenity_list, name="amenity-list"),
    path("metro/amenities/<uuid:amenity_id>/", aminity.amenity_detail, name="amenity-detail"),
]
