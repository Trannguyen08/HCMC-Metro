import json
import time
from django.http import StreamingHttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.shortcuts import get_object_or_404
from infrastructure.redis_client import get_redis
from ..services.tracking_service import TrackingService, LIVE_TRAINS_CHANNEL
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


class LiveTrainStreamView(APIView):
    """
    Server-Sent Events (SSE) stream for real-time train telemetry via Redis Pub/Sub.
    Falls back to 3-second periodic push if Redis Pub/Sub is unavailable.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        def event_stream():
            service = TrackingService()
            initial = service.get_live_trains()
            yield f"data: {json.dumps(initial)}\n\n"

            r = get_redis()
            if r is not None:
                pubsub = r.pubsub(ignore_subscribe_messages=True)
                try:
                    pubsub.subscribe(LIVE_TRAINS_CHANNEL)
                    last_heartbeat = time.time()
                    while True:
                        msg = pubsub.get_message(timeout=1.0)
                        if msg and msg.get("type") == "message":
                            raw = msg.get("data")
                            if isinstance(raw, bytes):
                                raw = raw.decode("utf-8")
                            yield f"data: {raw}\n\n"
                            last_heartbeat = time.time()
                        elif time.time() - last_heartbeat >= 10.0:
                            # Heartbeat keeps connection alive and handles simulator pause
                            snapshot = service.get_live_trains()
                            yield f"data: {json.dumps(snapshot)}\n\n"
                            last_heartbeat = time.time()
                except GeneratorExit:
                    pass
                finally:
                    try:
                        pubsub.unsubscribe(LIVE_TRAINS_CHANNEL)
                        pubsub.close()
                    except Exception:
                        pass
            else:
                try:
                    while True:
                        time.sleep(3.0)
                        snapshot = service.get_live_trains(use_telemetry=False)
                        yield f"data: {json.dumps(snapshot)}\n\n"
                except GeneratorExit:
                    pass

        response = StreamingHttpResponse(event_stream(), content_type="text/event-stream")
        response["Cache-Control"] = "no-cache"
        response["X-Accel-Buffering"] = "no"
        return response
