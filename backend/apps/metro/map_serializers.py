from rest_framework import serializers

from apps.metro.models import Amenity, AmenityCategory, Station, MetroLine, BusStopCache


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


class BusStopCacheSerializer(serializers.ModelSerializer):
    class Meta:
        model = BusStopCache
        fields = [
            "id",
            "name",
            "code",
            "latitude",
            "longitude",
            "address",
            "routes",
            "distance_to_station",
        ]
