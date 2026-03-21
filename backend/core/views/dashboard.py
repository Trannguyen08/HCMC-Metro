from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from core.permissions import IsAdminUser
from core.services.dashboard_service import DashboardService

dashboard_service = DashboardService()

@api_view(["GET"])
@permission_classes([IsAdminUser])
def admin_stats(request):
    """Simple dashboard stats."""
    stats = dashboard_service.get_stats()
    return Response(stats)

from rest_framework.permissions import AllowAny
@api_view(["GET"])
@permission_classes([AllowAny])
def health(request):
    return Response({"status": "ok"})

