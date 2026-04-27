from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from django.core.cache import cache
from django.conf import settings
from .models import Feedback
from .serializers import FeedbackSerializer, FeedbackAdminUpdateSerializer

class UserFeedbackViewSet(viewsets.ModelViewSet):
    """
    ViewSet for users to create and view their own feedback.
    """
    serializer_class = FeedbackSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Feedback.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        if serializer.validated_data.get('type') == 'experience':
            serializer.save(user=self.request.user, status='resolved')
            cache.delete("public_feedback_list")
        else:
            serializer.save(user=self.request.user)
        # Invalidate admin cache when new feedback is created
        cache.delete("admin_feedback_list")
        # Invalidate user specific cache
        cache.delete(f"user_feedback_list_{self.request.user.id}")

    def list(self, request, *args, **kwargs):
        cache_key = f"user_feedback_list_{request.user.id}"
        cached_data = cache.get(cache_key)
        if cached_data:
            return Response(cached_data)

        response = super().list(request, *args, **kwargs)
        cache.set(cache_key, response.data, settings.CACHE_TTL_HOT)
        return response

class AdminFeedbackViewSet(viewsets.ModelViewSet):
    """
    ViewSet for admins to view and manage all feedback.
    """
    queryset = Feedback.objects.all().select_related("user", "train")
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

    def get_serializer_class(self):
        if self.action in ["update", "partial_update"]:
            return FeedbackAdminUpdateSerializer
        return FeedbackSerializer

    def list(self, request, *args, **kwargs):
        cache_key = "admin_feedback_list"
        cached_data = cache.get(cache_key)
        if cached_data:
            return Response(cached_data)

        response = super().list(request, *args, **kwargs)
        cache.set(cache_key, response.data, settings.CACHE_TTL_HOT)
        return response

    def perform_update(self, serializer):
        instance = serializer.save()
        # Invalidate caches
        cache.delete("admin_feedback_list")
        cache.delete("public_feedback_list")
        cache.delete(f"user_feedback_list_{instance.user.id}")

class PublicFeedbackViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for public to view recent resolved feedback.
    """
    queryset = Feedback.objects.filter(status="resolved").select_related("user").order_by("-created_at")[:10]
    serializer_class = FeedbackSerializer
    permission_classes = [permissions.AllowAny]

    def list(self, request, *args, **kwargs):
        cache_key = "public_feedback_list"
        cached_data = cache.get(cache_key)
        if cached_data:
            return Response(cached_data)

        response = super().list(request, *args, **kwargs)
        cache.set(cache_key, response.data, 3600) # 1 hour
        return response

