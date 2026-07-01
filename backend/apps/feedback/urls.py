from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserFeedbackViewSet, AdminFeedbackViewSet, PublicFeedbackViewSet

router = DefaultRouter()
router.register(r"user", UserFeedbackViewSet, basename="user-feedback")
router.register(r"admin", AdminFeedbackViewSet, basename="admin-feedback")
router.register(r"public", PublicFeedbackViewSet, basename="public-feedback")

urlpatterns = [
    path("", include(router.urls)),
]
