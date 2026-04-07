from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from core.permissions import IsAdminUser
from apps.users.services.user_service import UserService

user_service = UserService()

@api_view(["GET"])
@permission_classes([IsAdminUser])
def admin_users(request):
    users_data = user_service.get_users_for_admin(limit=100)
    return Response(users_data)
