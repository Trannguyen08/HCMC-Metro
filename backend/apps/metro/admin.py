from django.contrib import admin
from .models import MetroLine, Station, Train, TrainStationLog, AmenityCategory, AmenityType, Amenity, BusStop

@admin.register(TrainStationLog)
class TrainStationLogAdmin(admin.ModelAdmin):
    list_display = ('train', 'station', 'direction', 'arrived_at', 'departed_at', 'trip_run')
    list_filter = ('train', 'station', 'direction', 'arrived_at')
    search_fields = ('train__train_number', 'station__name', 'trip_run')
    ordering = ('-arrived_at',)
    readonly_fields = ('created_at',)

@admin.register(MetroLine)
class MetroLineAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'status', 'is_active')

@admin.register(Station)
class StationAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'line', 'sequence_order', 'is_active')

@admin.register(Train)
class TrainAdmin(admin.ModelAdmin):
    list_display = ('train_number', 'direction', 'status', 'current_station', 'is_active')
