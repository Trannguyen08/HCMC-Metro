from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from ..models import User, Ticket, MetroLine, Station
from .common import IsAdminUser, _user_data

@api_view(["GET"])
@permission_classes([IsAdminUser])
def admin_stats(request):
    """Simple dashboard stats."""
    return Response({
        "total_users": User.objects.count(),
        "total_tickets": Ticket.objects.count(),
        "total_lines": MetroLine.objects.count(),
        "total_stations": Station.objects.count(),
        "revenue_vnd": 25450000,
    })

@api_view(["GET"])
@permission_classes([IsAdminUser])
def admin_users(request):
    users = User.objects.all().order_by("-created_at")[:100]
    data = [_user_data(u) for u in users]
    return Response(data)

@api_view(["GET"])
@permission_classes([IsAdminUser])
def admin_metro_lines(request):
    lines = MetroLine.objects.all()
    data = [{
        "id": l.id,
        "name": l.name,
        "code": l.code,
        "color": l.color,
        "is_active": l.is_active
    } for l in lines]
    return Response(data)
