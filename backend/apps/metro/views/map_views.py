from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.metro.models import Amenity, AmenityCategory, BusStopCache, MetroLine, Station
from apps.metro.map_serializers import (
    AmenityCategorySerializer,
    AmenityMapSerializer,
    BusStopCacheSerializer,
    MetroLineMapSerializer,
    StationMapSerializer,
)


@api_view(["GET"])
@permission_classes([AllowAny])
def map_init(request):
    """
    Returns initial map data:
    - Metro lines with geojson
    - Stations with lat/lng
    - Amenity categories for filtering
    """
    lines = MetroLine.objects.filter(is_active=True).order_by("id")
    stations = Station.objects.filter(is_active=True).order_by("sequence_order")
    categories = AmenityCategory.objects.all().order_by("sort_order")

    return Response({
        "lines": MetroLineMapSerializer(lines, many=True).data,
        "stations": StationMapSerializer(stations, many=True).data,
        "categories": AmenityCategorySerializer(categories, many=True).data,
    })


@api_view(["GET"])
@permission_classes([AllowAny])
def map_amenities(request):
    """
    Returns amenities filtered by bounds and category.
    Query params:
    - category: slug (optional)
    - sw_lat, sw_lng, ne_lat, ne_lng: bounding box (optional)
    - station: station code (optional)
    """
    queryset = Amenity.objects.filter(is_active=True, latitude__isnull=False, longitude__isnull=False).select_related("category", "station")

    category = request.GET.get("category")
    if category and category != "all":
        queryset = queryset.filter(category__slug=category)

    station = request.GET.get("station")
    if station:
        queryset = queryset.filter(station__code=station)

    sw_lat = request.GET.get("sw_lat")
    sw_lng = request.GET.get("sw_lng")
    ne_lat = request.GET.get("ne_lat")
    ne_lng = request.GET.get("ne_lng")
    
    if all([sw_lat, sw_lng, ne_lat, ne_lng]):
        try:
            queryset = queryset.filter(
                latitude__gte=float(sw_lat),
                latitude__lte=float(ne_lat),
                longitude__gte=float(sw_lng),
                longitude__lte=float(ne_lng),
            )
        except ValueError:
            pass
            
    return Response(AmenityMapSerializer(queryset, many=True).data)


@api_view(["GET"])
@permission_classes([AllowAny])
def map_bus_stops(request):
    """
    Returns bus stops near a specific coordinate or station.
    """
    queryset = BusStopCache.objects.all()
    
    station_id = request.GET.get("station_id")
    if station_id:
        queryset = queryset.filter(station_id=station_id)
        
    return Response(BusStopCacheSerializer(queryset, many=True).data)


@api_view(["GET"])
@permission_classes([AllowAny])
def search_stations(request):
    """
    Simple search endpoint for map.
    """
    q = request.GET.get("q", "").strip()
    if not q:
        return Response([])

    stations = Station.objects.filter(name__icontains=q, is_active=True)[:10]
    return Response(StationMapSerializer(stations, many=True).data)
