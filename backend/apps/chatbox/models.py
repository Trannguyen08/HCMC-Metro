import uuid
from django.db import models


class ChatSession(models.Model):
    """Phiên hội thoại chatbox — mỗi session tương ứng 1 tab/trình duyệt."""
    id = models.CharField(max_length=36, primary_key=True, default=uuid.uuid4)
    session_token = models.CharField(max_length=255, unique=True)
    # user_id trỏ về users.id (UUID). Dùng CharField để tránh tạo FK migration vì managed=False.
    user_id = models.CharField(max_length=36, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    message_count = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "chat_sessions"
        managed = False  # Bảng đã tạo qua chatbox_migration.sql


class ChatMessage(models.Model):
    """Tin nhắn trong phiên hội thoại."""
    ROLE_CHOICES = [("user", "User"), ("assistant", "Assistant")]

    session = models.ForeignKey(
        ChatSession,
        on_delete=models.CASCADE,
        related_name="messages",
        db_column="session_id",
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    content = models.TextField()
    tokens_used = models.IntegerField(default=0)
    response_time_ms = models.IntegerField(default=0)
    is_flagged = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "chat_messages"
        managed = False
        ordering = ["created_at"]
