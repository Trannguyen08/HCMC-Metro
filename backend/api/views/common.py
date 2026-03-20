from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from ..models import User

def _make_tokens(user: User) -> dict:
    """Generate access + refresh JWT pair for a User instance."""
    refresh = RefreshToken()
    refresh["user_id"] = str(user.id)
    refresh["email"] = user.email
    refresh["full_name"] = user.full_name
    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
    }

class IsAdminUser(permissions.BasePermission):
    """Allows access only to admin users."""
    def has_permission(self, request, view):
        user_id = request.auth.payload.get("user_id") if request.auth else None
        if not user_id:
            return False
        user = User.objects.filter(id=user_id, is_active=True).first()
        return bool(user and user.is_admin)

def _user_data(user: User) -> dict:
    return {
        "id": str(user.id),
        "full_name": user.full_name,
        "email": user.email,
        "phone": user.phone or "",
        "avatar_url": user.avatar_url or "",
        "email_verified": user.email_verified,
        "is_admin": user.is_admin,
    }

@api_view(["GET"])
@permission_classes([AllowAny])
def health(request):
    return Response({"status": "ok"})
