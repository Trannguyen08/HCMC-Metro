import uuid

from django.db import models

from apps.metro.models import Train


class Feedback(models.Model):
    TYPE_CHOICES = [
        ("facility", "Cơ sở vật chất"),
        ("experience", "Trải nghiệm"),
        ("error", "Lỗi"),
    ]

    STATUS_CHOICES = [
        ("pending", "Chờ xử lý"),
        ("processing", "Đang xử lý"),
        ("resolved", "Đã giải quyết"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        related_name="feedbacks",
        db_column="user_id",
    )
    type = models.CharField(max_length=30, choices=TYPE_CHOICES)
    content = models.TextField()
    train = models.ForeignKey(
        Train,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column="train_id",
        related_name="feedbacks",
    )
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default="pending")
    rating = models.IntegerField(default=5)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "feedbacks"
        managed = True
        ordering = ["-created_at"]

    def __str__(self):
        return f"Feedback from {self.user.full_name} - {self.type}"
