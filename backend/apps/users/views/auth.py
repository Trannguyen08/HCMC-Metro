from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from apps.users.serializers.auth import (
    GoogleLoginSerializer,
    LoginSerializer,
    RegisterSerializer,
    VerifyOTPSerializer,
    ForgotPasswordSerializer,
    VerifyForgotPasswordSerializer,
    ChangePasswordSerializer,
)
from apps.users.services.auth_service import AuthService
from infrastructure.rate_limit import rate_limit

auth_service = AuthService()


@api_view(["POST"])
@permission_classes([AllowAny])
@rate_limit(limit=3, window_seconds=60)
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({"errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    data = serializer.validated_data
    try:
        result = auth_service.initiate_registration(
            full_name=data["full_name"],
            email=data["email"],
            phone=data.get("phone"),
            date_of_birth=data.get("date_of_birth"),
            password=data["password"],
        )
        return Response(result, status=status.HTTP_201_CREATED)
    except ValueError as e:
        return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([AllowAny])
@rate_limit(limit=10, window_seconds=60)
def verify_register_otp(request):
    serializer = VerifyOTPSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({"detail": "Thiếu token hoặc OTP."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        tokens, user_data = auth_service.verify_registration_otp(
            token=serializer.validated_data["verification_token"],
            otp_input=serializer.validated_data["otp"].strip(),
        )
        return Response({**tokens, "user": user_data})
    except ValueError as e:
        return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([AllowAny])
@rate_limit(limit=5, window_seconds=60)
def login(request):
    serializer = LoginSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({"detail": "Lỗi xác thực."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        tokens, user_data = auth_service.login_with_password(
            identifier=serializer.validated_data["identifier"],
            password=serializer.validated_data["password"],
        )
        return Response({**tokens, "user": user_data})
    except ValueError as e:
        return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([AllowAny])
@rate_limit(limit=10, window_seconds=60)
def google_login(request):
    serializer = GoogleLoginSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({"detail": "Missing credential."}, status=status.HTTP_400_BAD_REQUEST)

    token = serializer.validated_data.get("credential") or serializer.validated_data.get("access_token")
    if not token:
        return Response({"detail": "Missing credential."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        tokens, user_data = auth_service.process_google_login(token)
        return Response({**tokens, "user": user_data})
    except Exception as e:
        return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)


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
    user = request.user
    if not user or not getattr(user, "is_active", False):
        return Response({"detail": "Tài khoản không tồn tại."}, status=status.HTTP_404_NOT_FOUND)

    return Response(auth_service.serialize_user(user))

@api_view(["POST"])
@permission_classes([AllowAny])
@rate_limit(limit=3, window_seconds=60)
def forgot_password(request):
    serializer = ForgotPasswordSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    try:
        result = auth_service.initiate_forgot_password(serializer.validated_data["email"])
        return Response(result, status=status.HTTP_200_OK)
    except ValueError as e:
        return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(["POST"])
@permission_classes([AllowAny])
@rate_limit(limit=10, window_seconds=60)
def verify_forgot_password(request):
    serializer = VerifyForgotPasswordSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    try:
        tokens, user_data = auth_service.verify_forgot_password_otp(
            token=serializer.validated_data["verification_token"],
            otp_input=serializer.validated_data["otp"].strip(),
            new_password=serializer.validated_data["new_password"]
        )
        return Response({**tokens, "user": user_data})
    except ValueError as e:
        return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def change_password(request):
    serializer = ChangePasswordSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    try:
        auth_service.change_password(
            user=request.user,
            old_password=serializer.validated_data["old_password"],
            new_password=serializer.validated_data["new_password"]
        )
        return Response({"detail": "Đổi mật khẩu thành công."})
    except ValueError as e:
        return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
