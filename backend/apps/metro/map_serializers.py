from datetime import datetime, timedelta
from django.utils import timezone
from rest_framework import serializers

from apps.metro.models import Amenity, AmenityCategory, BusStop, MetroLine, Station


class MetroLineMapSerializer(serializers.ModelSerializer):
    class Meta:
        model = MetroLine
        fields = [
            "id",
            "name",
            "code",
            "color_hex",
            "stroke_weight",
            "geojson_coordinates",
            "status",
        ]


class StationMapSerializer(serializers.ModelSerializer):
    class Meta:
        model = Station
        fields = [
            "id",
            "name",
            "code",
            "latitude",
            "longitude",
            "sequence_order",
        ]


class AmenityCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = AmenityCategory
        fields = [
            "id",
            "name",
            "slug",
            "icon_svg",
            "color_hex",
            "bg_color_hex",
            "sort_order",
        ]


class AmenityMapSerializer(serializers.ModelSerializer):
    category_slug = serializers.CharField(source="category.slug", read_only=True)
    category_name = serializers.CharField(source="category.name", read_only=True)
    station_code = serializers.CharField(source="station.code", read_only=True)

    class Meta:
        model = Amenity
        fields = [
            "id",
            "name",
            "slug",
            "category_slug",
            "category_name",
            "address",
            "distance_meters",
            "latitude",
            "longitude",
            "image_url",
            "opening_hours",
            "rating",
            "station_code",
        ]


class BusStopMapSerializer(serializers.ModelSerializer):
    station_code = serializers.CharField(source="station.code", read_only=True)
    station_name = serializers.CharField(source="station.name", read_only=True)
    schedules = serializers.SerializerMethodField()

    class Meta:
        model = BusStop
        fields = [
            "id",
            "name",
            "code",
            "latitude",
            "longitude",
            "address",
            "routes",
            "schedules",
            "station_code",
            "station_name",
            "distance_to_station",
            "stop_type",
            "note",
        ]

    def get_schedules(self, obj):
        raw_schedules = obj.schedules or []
        if not raw_schedules:
            return []

        now = timezone.localtime()
        current_minutes = now.hour * 60 + now.minute
        is_peak = (7 * 60 <= current_minutes <= 9 * 60) or (16 * 60 + 30 <= current_minutes <= 19 * 60)

        enriched = []
        for item in raw_schedules:
            entry = dict(item)
            start_min = int(item.get("start_hour", 5)) * 60 + int(item.get("start_minute", 0))
            end_hour = int(item.get("end_hour", 22))
            if now.weekday() >= 4 and item.get("weekend_end_hour"):
                end_hour = int(item.get("weekend_end_hour"))
            end_min = end_hour * 60 + int(item.get("end_minute", 0))

            headway = int(item.get("peak_headway_min", 10)) if is_peak else int(item.get("offpeak_headway_min", 15))
            headway = max(headway, 3)

            next_arrivals = []
            if current_minutes <= end_min:
                # Offset slightly per route hash so different routes don't show identical minutes
                route_offset = sum(ord(c) for c in str(item.get("route", ""))) % headway
                first_candidate = max(start_min + route_offset, current_minutes + 1)
                # Align to headway grid from start_min + route_offset
                if first_candidate > start_min + route_offset:
                    steps = ((first_candidate - (start_min + route_offset) + headway - 1) // headway)
                    next_min = start_min + route_offset + steps * headway
                else:
                    next_min = start_min + route_offset

                for _ in range(3):
                    if next_min <= end_min:
                        hh, mm = divmod(next_min, 60)
                        next_arrivals.append(f"{hh:02d}:{mm:02d}")
                        next_min += headway

            entry["current_headway_min"] = headway
            entry["next_arrivals"] = next_arrivals
            entry["is_operating_now"] = start_min <= current_minutes <= end_min
            enriched.append(entry)

        return enriched
