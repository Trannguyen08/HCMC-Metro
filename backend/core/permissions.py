from rest_framework import permissions
from apps.users.models import User

class IsAdminUser(permissions.BasePermission):
    """Allows access only to admin users."""
    def has_permission(self, request, view):
        user_id = request.auth.payload.get("user_id") if request.auth else None
        if not user_id:
            return False
        user = User.objects.filter(id=user_id, is_active=True).first()
        return bool(user and user.is_admin)

class IsOwnerUser(permissions.BasePermission):
    """Allows access only to the user who owns the object."""
    def has_object_permission(self, request, view, obj):
        user_id = request.auth.payload.get("user_id") if request.auth else None
        if not user_id:
            return False
        return str(obj.user_id) == str(user_id)
