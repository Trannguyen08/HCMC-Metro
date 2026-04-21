from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.shortcuts import get_object_or_404
from ..services.tracking_service import TrackingService
from ..models import Station

class LiveTrainTrackingView(APIView):
    """
    Returns the real-time (simulated) locations of all active trains.
    """
    permission_classes = [permissions.AllowAny]
    def get(self, request):
        service = TrackingService()
        trains = service.get_live_trains()
        return Response(trains)

class StationArrivalETAView(APIView):
    """
    Returns the estimated arrival times for trains at a specific station.
    """
    permission_classes = [permissions.AllowAny]
    def get(self, request, station_id):
        service = TrackingService()
        arrivals = service.get_station_arrivals(station_id)
        return Response(arrivals)

class StationListView(APIView):
    """
    Returns a list of all stations for tracking selection.
    """
    permission_classes = [permissions.AllowAny]
    def get(self, request):
        stations = Station.objects.filter(is_active=True).order_by('sequence_order')
        data = [{
            'id': s.id,
            'name': s.name,
            'latitude': float(s.latitude),
            'longitude': float(s.longitude),
            'sequence_order': s.sequence_order
        } for s in stations]
        return Response(data)
