import hashlib
import os
from rest_framework import serializers
from .models import User


class RegisterSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    password = serializers.CharField(min_length=6, write_only=True)

    def validate_email(self, value):
        if User.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError("Email này đã được sử dụng.")
        return value.lower()

    def create(self, validated_data):
        password = validated_data.pop("password")
        password_hash = _hash_password(password)
        user = User.objects.create(
            full_name=validated_data["full_name"],
            email=validated_data["email"],
            phone=validated_data.get("phone", ""),
            password_hash=password_hash,
            is_active=True,
            email_verified=False,
        )
        return user


class LoginSerializer(serializers.Serializer):
    identifier = serializers.CharField()   # email or phone
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        identifier = data["identifier"].strip()
        password = data["password"]

        # Try email first, then phone
        user = None
        if "@" in identifier:
            user = User.objects.filter(email=identifier.lower(), is_active=True).first()
        else:
            user = User.objects.filter(phone=identifier, is_active=True).first()

        if not user:
            raise serializers.ValidationError("Tài khoản không tồn tại.")
        if not user.password_hash:
            raise serializers.ValidationError("Tài khoản này đăng nhập bằng Google. Vui lòng dùng nút Google.")
        if not _verify_password(password, user.password_hash):
            raise serializers.ValidationError("Mật khẩu không đúng.")

        data["user"] = user
        return data


def _hash_password(password: str) -> str:
    """Simple sha256 + salt hash. In production use bcrypt/argon2."""
    salt = os.urandom(16).hex()
    hashed = hashlib.sha256(f"{salt}{password}".encode()).hexdigest()
    return f"{salt}:{hashed}"


def _verify_password(password: str, password_hash: str) -> bool:
    try:
        salt, hashed = password_hash.split(":", 1)
        expected = hashlib.sha256(f"{salt}{password}".encode()).hexdigest()
        return expected == hashed
    except Exception:
        return False
