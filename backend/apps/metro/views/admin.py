from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from core.permissions import IsAdminUser
from apps.metro.services.metro_service import MetroService

metro_service = MetroService()

@api_view(["GET"])
@permission_classes([IsAdminUser])
def admin_metro_lines(request):
    lines = metro_service.get_all_lines()
    data = [{
        "id": l.id,
        "name": l.name,
        "code": l.code,
        "color": l.color,
        "is_active": l.is_active
    } for l in lines]
    return Response(data)
