from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from apps.metro.models import Amenity, Station, Train
from apps.metro.serializers import (
    AMENITY_TYPE_ALIASES,
    AmenitySerializer,
    StationSerializer,
    TrainSerializer,
)


@api_view(["GET"])
@permission_classes([AllowAny])
def train_list(request):
    trains = Train.objects.filter(is_active=True).order_by("train_number")
    serializer = TrainSerializer(trains, many=True)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([AllowAny])
def station_list(request):
    stations = (
        Station.objects.filter(is_active=True)
        .select_related("line")
        .order_by("sequence_order", "id")
    )
    serializer = StationSerializer(stations, many=True)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([AllowAny])
def amenity_list(request):
    queryset = (
        Amenity.objects.filter(is_active=True)
        .select_related("station", "amenity_type", "station__line")
        .order_by("distance_meters", "name")
    )

    search = request.query_params.get("search", "").strip()
    station_id = request.query_params.get("station", "").strip()
    amenity_type = request.query_params.get("type", "").strip().lower()

    if search:
        queryset = queryset.filter(
            Q(name__icontains=search)
            | Q(address__icontains=search)
            | Q(description__icontains=search)
        )

    if station_id:
        station_filter = Q(station__code__iexact=station_id)
        if station_id.isdigit():
            station_filter |= Q(station__id=int(station_id))
        queryset = queryset.filter(station_filter)

    if amenity_type:
        aliases = AMENITY_TYPE_ALIASES.get(amenity_type, (amenity_type,))
        type_filter = Q()
        for alias in aliases:
            type_filter |= Q(amenity_type__name__icontains=alias)
        queryset = queryset.filter(type_filter)

    serializer = AmenitySerializer(queryset, many=True)
    return Response({
        "data": serializer.data,
        "total": queryset.count(),
    })


@api_view(["GET"])
@permission_classes([AllowAny])
def amenity_detail(request, id_slug):
    # UUIDs are 36 chars long. Extract it from the beginning of id_slug.
    amenity_id = id_slug[:36]
    amenity = get_object_or_404(
        Amenity.objects.filter(is_active=True).select_related("station", "amenity_type", "station__line"),
        pk=amenity_id,
    )
    serializer = AmenitySerializer(amenity)
    return Response(serializer.data)
