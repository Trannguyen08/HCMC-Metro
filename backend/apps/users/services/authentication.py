from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import AuthenticationFailed
from django.utils.translation import gettext_lazy as _
from apps.users.models import User

class CustomJWTAuthentication(JWTAuthentication):
    def get_user(self, validated_token):
        try:
            user_id = validated_token["user_id"]
        except KeyError:
            raise AuthenticationFailed(_("Token contained no recognizable user identification"), code="token_not_valid")

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise AuthenticationFailed(_("User not found"), code="user_not_found")
        except Exception as e:
            raise AuthenticationFailed(str(e), code="user_error")

        if getattr(user, "is_active", None) is False:
            raise AuthenticationFailed(_("User is inactive"), code="user_inactive")

        return user
