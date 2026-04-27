from rest_framework import serializers

from apps.metro.serializers import TrainSerializer

from .models import Feedback


class FeedbackSerializer(serializers.ModelSerializer):
    user_full_name = serializers.CharField(source="user.full_name", read_only=True)
    train_detail = TrainSerializer(source="train", read_only=True)

    class Meta:
        model = Feedback
        fields = [
            "id",
            "user",
            "user_full_name",
            "type",
            "content",
            "train",
            "train_detail",
            "status",
            "rating",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "user", "status", "created_at", "updated_at"]


class FeedbackAdminUpdateSerializer(serializers.ModelSerializer):
    ALLOWED_TRANSITIONS = {
        "pending": {"pending", "processing", "resolved"},
        "processing": {"processing", "resolved"},
        "resolved": {"resolved"},
    }

    class Meta:
        model = Feedback
        fields = ["status"]

    def validate_status(self, value):
        instance = getattr(self, "instance", None)
        if instance is None:
            return value

        current_status = instance.status
        allowed_statuses = self.ALLOWED_TRANSITIONS.get(current_status, {current_status})
        if value not in allowed_statuses:
            raise serializers.ValidationError("Không thể cập nhật trạng thái theo luồng xử lý này.")

        return value
