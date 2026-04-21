from rest_framework import serializers

class RegisterSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    date_of_birth = serializers.DateField(required=False, allow_null=True)
    password = serializers.CharField(min_length=6, write_only=True)

class VerifyOTPSerializer(serializers.Serializer):
    verification_token = serializers.CharField()
    otp = serializers.CharField(max_length=6)

class LoginSerializer(serializers.Serializer):
    identifier = serializers.CharField()   # email or phone
    password = serializers.CharField(write_only=True)

class GoogleLoginSerializer(serializers.Serializer):
    credential = serializers.CharField(required=False, allow_blank=True)
    access_token = serializers.CharField(required=False, allow_blank=True)

class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()

class VerifyForgotPasswordSerializer(serializers.Serializer):
    verification_token = serializers.CharField()
    otp = serializers.CharField(max_length=6)
    new_password = serializers.CharField(min_length=6, write_only=True)

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(min_length=6, write_only=True)
