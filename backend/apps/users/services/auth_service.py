import secrets
import hashlib
import os
import requests
from django.conf import settings
from django.core.mail import send_mail
from django.core import signing
from rest_framework_simplejwt.tokens import RefreshToken
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from apps.users.repositories.user_repository import UserRepository
from apps.users.models.oauth import OAuthAccount

class AuthService:
    def __init__(self):
        self.user_repo = UserRepository()

    def generate_tokens(self, user) -> dict:
        refresh = RefreshToken()
        refresh["user_id"] = str(user.id)
        refresh["email"] = user.email
        refresh["full_name"] = user.full_name
        return {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }

    def serialize_user(self, user) -> dict:
        return {
            "id": str(user.id),
            "full_name": user.full_name,
            "email": user.email,
            "phone": user.phone or "",
            "avatar_url": user.avatar_url or "",
            "email_verified": user.email_verified,
            "is_admin": user.is_admin,
        }

    def send_register_otp(self, full_name, email, otp):
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

    def hash_password(self, password: str) -> str:
        salt = os.urandom(16).hex()
        hashed = hashlib.sha256(f"{salt}{password}".encode()).hexdigest()
        return f"{salt}:{hashed}"

    def verify_password(self, password: str, password_hash: str) -> bool:
        try:
            salt, hashed = password_hash.split(":", 1)
            expected = hashlib.sha256(f"{salt}{password}".encode()).hexdigest()
            return expected == hashed
        except Exception:
            return False

    def initiate_registration(self, full_name, email, phone, password):
        if self.user_repo.get_by_email(email.lower()):
            raise ValueError("Email này đã được sử dụng.")
        
        password_hash = self.hash_password(password)
        otp = f"{secrets.randbelow(1_000_000):06d}"
        payload = {
            "full_name": full_name,
            "email": email.lower(),
            "phone": phone or "",
            "password_hash": password_hash,
            "otp": otp,
        }
        
        try:
            self.send_register_otp(full_name, email, otp)
        except Exception as exc:
            pass # Or log it
        
        token = signing.dumps(payload, salt="register-otp")
        return {
            "requires_email_verification": True,
            "email": email,
            "verification_token": token,
        }

    def verify_registration_otp(self, token, otp_input):
        try:
            payload = signing.loads(token, salt="register-otp", max_age=600)
        except signing.SignatureExpired:
            raise ValueError("OTP đã hết hạn. Vui lòng đăng ký lại.")
        except signing.BadSignature:
            raise ValueError("Token không hợp lệ.")
            
        if otp_input != payload.get("otp"):
            raise ValueError("OTP không đúng.")
            
        email = payload["email"]
        if self.user_repo.get_by_email(email.lower()):
            raise ValueError("Email này đã được sử dụng.")
            
        user = self.user_repo.create(
            full_name=payload["full_name"],
            email=email,
            phone=payload.get("phone", ""),
            password_hash=payload["password_hash"],
            is_active=True,
            email_verified=True,
        )
        return self.generate_tokens(user), self.serialize_user(user)

    def login_with_password(self, identifier, password):
        user = None
        identifier = identifier.strip()
        if "@" in identifier:
            user = self.user_repo.get_by_email(identifier.lower())
        else:
            # Add get_by_phone to repo if needed. For now using ORM directly in service as pragmatic fallback
            from apps.users.models import User
            user = User.objects.filter(phone=identifier, is_active=True).first()
            
        if not user or not user.is_active:
            raise ValueError("Tài khoản không tồn tại.")
        if not user.password_hash:
            raise ValueError("Tài khoản này đăng nhập bằng Google. Vui lòng dùng nút Google.")
        if not self.verify_password(password, user.password_hash):
            raise ValueError("Mật khẩu không đúng.")
            
        return self.generate_tokens(user), self.serialize_user(user)

    def process_google_login(self, token):
        client_id = settings.GOOGLE_CLIENT_ID
        if not client_id:
            raise Exception("Google login is not configured.")
        try:
            if isinstance(token, str) and token.count(".") >= 2:
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
                    raise ValueError("Google access token không hợp lệ.")
                id_info = r.json()
        except ValueError as e:
            raise ValueError(f"Token không hợp lệ: {e}")

        google_sub = id_info.get("sub")
        if not google_sub:
            raise ValueError("Không lấy được thông tin Google user.")
            
        email = id_info.get("email", "").lower()
        full_name = id_info.get("name", "Google User")
        avatar_url = id_info.get("picture", "")

        oauth = OAuthAccount.objects.filter(provider="google", provider_id=google_sub).first()
        if oauth:
            user = oauth.user
        else:
            user = self.user_repo.get_by_email(email)
            if not user:
                user = self.user_repo.create(
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

        return self.generate_tokens(user), self.serialize_user(user)
