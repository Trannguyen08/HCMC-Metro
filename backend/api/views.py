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
import requests
import secrets

from .models import User, OAuthAccount
from .serializers import RegisterSerializer, LoginSerializer, _hash_password


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


def _user_data(user: User) -> dict:
    return {
        "id": str(user.id),
        "full_name": user.full_name,
        "email": user.email,
        "phone": user.phone or "",
        "avatar_url": user.avatar_url or "",
        "email_verified": user.email_verified,
    }


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


@api_view(["GET"])
@permission_classes([AllowAny])
def health(request):
    return Response({"status": "ok"})


@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({"errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    data = serializer.validated_data
    # Không tạo user ngay; chỉ hash mật khẩu và gửi OTP
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
        # Không chặn flow đăng ký nếu gửi email lỗi; chỉ log ra console.
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
        # Flatten DRF errors into a single message for FE
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
        payload = signing.loads(token, salt="register-otp", max_age=600)  # 10 phút
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
    """
    Accepts either:
    - Google ID token (JWT, usually returned as `credential` by Google Identity Services), or
    - Google OAuth access token (returned by @react-oauth/google useGoogleLogin as `access_token`).

    Verifies it, then creates or logs in the corresponding user.
    """
    credential = request.data.get("credential", "")  # id_token (JWT)
    access_token = request.data.get("access_token", "")  # OAuth access token
    token = credential or access_token
    if not token:
        return Response({"detail": "Missing credential."}, status=status.HTTP_400_BAD_REQUEST)

    client_id = settings.GOOGLE_CLIENT_ID
    if not client_id:
        return Response({"detail": "Google login is not configured."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    try:
        if credential or (isinstance(token, str) and token.count(".") >= 2):
            # Looks like a JWT id_token.
            id_info = id_token.verify_oauth2_token(
                token,
                google_requests.Request(),
                client_id,
            )
        else:
            # Treat as access token: fetch user profile from Google.
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

    # Check existing OAuth account
    oauth = OAuthAccount.objects.filter(provider="google", provider_id=google_sub).first()
    if oauth:
        user = oauth.user
    else:
        # Find or create user by email
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
    """Blacklist the refresh token."""
    refresh_token = request.data.get("refresh", "")
    if refresh_token:
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError:
            pass  # already invalid / blacklisted
    return Response({"detail": "Đã đăng xuất."})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    """
    Returns current user info. Requires valid Bearer access token.
    The JWT payload carries user_id; we look up the DB record.
    """
    user_id = request.auth.payload.get("user_id") if request.auth else None
    if not user_id:
        return Response({"detail": "Token không hợp lệ."}, status=status.HTTP_401_UNAUTHORIZED)

    user = User.objects.filter(id=user_id, is_active=True).first()
    if not user:
        return Response({"detail": "Tài khoản không tồn tại."}, status=status.HTTP_404_NOT_FOUND)

    return Response(_user_data(user))
