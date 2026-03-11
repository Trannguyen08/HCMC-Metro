from django.urls import path
from . import views

urlpatterns = [
    path("health/", views.health, name="health"),
    path("auth/register/", views.register, name="auth-register"),
    path("auth/login/", views.login, name="auth-login"),
    path("auth/email/verify-otp/", views.verify_register_otp, name="auth-email-verify-otp"),
    path("auth/google/", views.google_login, name="auth-google"),
    path("auth/logout/", views.logout, name="auth-logout"),
    path("auth/me/", views.me, name="auth-me"),
]
