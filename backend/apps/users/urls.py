from django.urls import path
from apps.users.views import auth, admin
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path("auth/register/", auth.register, name="auth-register"),
    path("auth/login/", auth.login, name="auth-login"),
    path("auth/login/refresh/", TokenRefreshView.as_view(), name="auth-login-refresh"),
    path("auth/email/verify-otp/", auth.verify_register_otp, name="auth-email-verify-otp"),
    path("auth/google/", auth.google_login, name="auth-google"),
    path("auth/logout/", auth.logout, name="auth-logout"),
    path("auth/me/", auth.me, name="auth-me"),
    path("admin/users/", admin.admin_users, name="admin_users"),
]
