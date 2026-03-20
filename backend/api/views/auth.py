import secrets
import requests
from django.conf import settings
from django.core.mail import send_mail
from django.core import signing
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from ..models import User, OAuthAccount
from ..serializers import (
    RegisterSerializer,
    LoginSerializer,
    _hash_password,
)
from .common import _make_tokens, _user_data

def _send_register_otp_email(full_name: str, email: str, otp: str) -> None:
    subject = "Mã OTP xác thực đăng ký HCMC Metro"
    body = (
        f"Xin chào {full_name},\n\n"
        f"Mã OTP xác thực email của bạn là: {otp}\n"
        f"Mã có hiệu lực trong 10 phút.\n\n"
        "Nếu bạn không yêu cầu đăng ký, hãy bỏ qua email này."
    )
    send_mail(
        subject=subject,
        message=body,
        from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
        recipient_list=[email],
        fail_silently=False,
    )

@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({"errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    data = serializer.validated_data
    raw_password = data["password"]
    password_hash = _hash_password(raw_password)
    otp = f"{secrets.randbelow(1_000_000):06d}"

    payload = {
        "full_name": data["full_name"],
        "email": data["email"],
        "phone": data.get("phone", ""),
        "password_hash": password_hash,
        "otp": otp,
    }

    try:
        _send_register_otp_email(data["full_name"], data["email"], otp)
    except Exception as exc:
        print("Send OTP email failed:", exc)

    token = signing.dumps(payload, salt="register-otp")
    return Response(
        {
            "requires_email_verification": True,
            "email": data["email"],
            "verification_token": token,
        },
        status=status.HTTP_201_CREATED,
    )

@api_view(["POST"])
@permission_classes([AllowAny])
def login(request):
    serializer = LoginSerializer(data=request.data)
    if not serializer.is_valid():
        errors = serializer.errors
        msg = ""
        for field_errors in errors.values():
            if isinstance(field_errors, list):
                msg = field_errors[0] if field_errors else "Lỗi xác thực."
                break
        return Response({"detail": msg or "Lỗi xác thực."}, status=status.HTTP_400_BAD_REQUEST)

    user = serializer.validated_data["user"]
    tokens = _make_tokens(user)
    return Response({**tokens, "user": _user_data(user)})

@api_view(["POST"])
@permission_classes([AllowAny])
def verify_register_otp(request):
    token = request.data.get("verification_token") or ""
    otp_input = (request.data.get("otp") or "").strip()
    if not token or not otp_input:
        return Response({"detail": "Thiếu token hoặc OTP."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        payload = signing.loads(token, salt="register-otp", max_age=600)
    except signing.SignatureExpired:
        return Response({"detail": "OTP đã hết hạn. Vui lòng đăng ký lại."}, status=status.HTTP_400_BAD_REQUEST)
    except signing.BadSignature:
        return Response({"detail": "Token không hợp lệ."}, status=status.HTTP_400_BAD_REQUEST)

    if otp_input != payload.get("otp"):
        return Response({"detail": "OTP không đúng."}, status=status.HTTP_400_BAD_REQUEST)

    email = payload["email"]
    if User.objects.filter(email=email.lower()).exists():
        return Response({"detail": "Email này đã được sử dụng."}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create(
        full_name=payload["full_name"],
        email=email,
        phone=payload.get("phone", ""),
        password_hash=payload["password_hash"],
        is_active=True,
        email_verified=True,
    )

    tokens = _make_tokens(user)
    return Response({**tokens, "user": _user_data(user)})

@api_view(["POST"])
@permission_classes([AllowAny])
def google_login(request):
    credential = request.data.get("credential", "")
    access_token = request.data.get("access_token", "")
    token = credential or access_token
    if not token:
        return Response({"detail": "Missing credential."}, status=status.HTTP_400_BAD_REQUEST)

    client_id = settings.GOOGLE_CLIENT_ID
    if not client_id:
        return Response({"detail": "Google login is not configured."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    try:
        if credential or (isinstance(token, str) and token.count(".") >= 2):
            id_info = id_token.verify_oauth2_token(
                token,
                google_requests.Request(),
                client_id,
            )
        else:
            r = requests.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {token}"},
                timeout=10,
            )
            if r.status_code != 200:
                return Response({"detail": "Google access token không hợp lệ."}, status=status.HTTP_401_UNAUTHORIZED)
            id_info = r.json()
    except ValueError as e:
        return Response({"detail": f"Token không hợp lệ: {e}"}, status=status.HTTP_401_UNAUTHORIZED)

    google_sub = id_info.get("sub")
    if not google_sub:
        return Response({"detail": "Không lấy được thông tin Google user."}, status=status.HTTP_401_UNAUTHORIZED)
    email = id_info.get("email", "").lower()
    full_name = id_info.get("name", "Google User")
    avatar_url = id_info.get("picture", "")

    oauth = OAuthAccount.objects.filter(provider="google", provider_id=google_sub).first()
    if oauth:
        user = oauth.user
    else:
        user = User.objects.filter(email=email).first()
        if not user:
            user = User.objects.create(
                email=email,
                full_name=full_name,
                avatar_url=avatar_url,
                is_active=True,
                email_verified=True,
                password_hash=None,
            )
        OAuthAccount.objects.create(
            user=user,
            provider="google",
            provider_id=google_sub,
        )

    tokens = _make_tokens(user)
    return Response({**tokens, "user": _user_data(user)})

@api_view(["POST"])
@permission_classes([AllowAny])
def logout(request):
    refresh_token = request.data.get("refresh", "")
    if refresh_token:
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError:
            pass
    return Response({"detail": "Đã đăng xuất."})

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    user_id = request.auth.payload.get("user_id") if request.auth else None
    if not user_id:
        return Response({"detail": "Token không hợp lệ."}, status=status.HTTP_401_UNAUTHORIZED)

    user = User.objects.filter(id=user_id, is_active=True).first()
    if not user:
        return Response({"detail": "Tài khoản không tồn tại."}, status=status.HTTP_404_NOT_FOUND)

    return Response(_user_data(user))
