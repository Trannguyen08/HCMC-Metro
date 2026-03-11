import uuid
from django.db import models


class User(models.Model):
    """Maps to the 'users' table created by schema.sql"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(max_length=255, unique=True)
    password_hash = models.TextField(null=True, blank=True)
    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20, null=True, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    avatar_url = models.TextField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    email_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "users"
        managed = False  # Table already created by schema.sql

    def __str__(self):
        return self.email


class OAuthAccount(models.Model):
    """Maps to the 'oauth_accounts' table created by schema.sql"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="oauth_accounts", db_column="user_id")
    provider = models.CharField(max_length=50)
    provider_id = models.CharField(max_length=255)
    access_token = models.TextField(null=True, blank=True)
    refresh_token = models.TextField(null=True, blank=True)
    token_expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "oauth_accounts"
        managed = False
        unique_together = [("provider", "provider_id")]

    def __str__(self):
        return f"{self.provider}:{self.provider_id}"
