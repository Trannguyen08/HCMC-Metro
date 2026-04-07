from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from core.permissions import IsAdminUser
from apps.metro.models import Amenity, AmenityType
from apps.metro.serializers import (
    AdminAmenitySerializer,
    AmenityTypeOptionSerializer,
    AMENITY_TYPE_ALIASES,
)
from apps.metro.services.metro_service import MetroService

metro_service = MetroService()

@api_view(["GET"])
@permission_classes([IsAdminUser])
def admin_metro_lines(request):
    lines = metro_service.get_all_lines()
    if isinstance(lines, list) and lines and isinstance(lines[0], dict):
        return Response(lines)
    return Response([{
        "id": l.id,
        "name": l.name,
        "code": l.code,
        "color": l.color,
        "is_active": l.is_active
    } for l in lines])


@api_view(["GET"])
@permission_classes([IsAdminUser])
def admin_amenity_types(request):
    amenity_types = AmenityType.objects.all().order_by("name")
    serializer = AmenityTypeOptionSerializer(amenity_types, many=True)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAdminUser])
def admin_amenity_list(request):
    queryset = Amenity.objects.select_related("station", "amenity_type").order_by("-updated_at", "name")

    search = request.query_params.get("search", "").strip()
    station = request.query_params.get("station", "").strip()
    category = request.query_params.get("category", "").strip().lower()
    is_active = request.query_params.get("is_active", "").strip().lower()

    if search:
        queryset = queryset.filter(
            Q(name__icontains=search)
            | Q(address__icontains=search)
            | Q(description__icontains=search)
            | Q(station__name__icontains=search)
        )

    if station:
        station_filter = Q(station__code__iexact=station)
        if station.isdigit():
            station_filter |= Q(station__id=int(station))
        queryset = queryset.filter(station_filter)

    if category:
        aliases = AMENITY_TYPE_ALIASES.get(category, (category,))
        type_filter = Q()
        for alias in aliases:
            type_filter |= Q(amenity_type__name__icontains=alias)
        queryset = queryset.filter(type_filter)

    if is_active in {"true", "false"}:
        queryset = queryset.filter(is_active=is_active == "true")

    serializer = AdminAmenitySerializer(queryset, many=True)
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAdminUser])
def admin_amenity_create(request):
    serializer = AdminAmenitySerializer(data=request.data)
    if serializer.is_valid():
        amenity = serializer.save()
        return Response(AdminAmenitySerializer(amenity).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "PUT", "DELETE"])
@permission_classes([IsAdminUser])
def admin_amenity_detail(request, pk):
    amenity = get_object_or_404(
        Amenity.objects.select_related("station", "amenity_type"),
        pk=pk,
    )

    if request.method == "GET":
        return Response(AdminAmenitySerializer(amenity).data)

    if request.method == "PUT":
        serializer = AdminAmenitySerializer(amenity, data=request.data, partial=True)
        if serializer.is_valid():
            amenity = serializer.save()
            return Response(AdminAmenitySerializer(amenity).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    amenity.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)
