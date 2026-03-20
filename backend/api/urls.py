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

    # News
    path("news/", views.public_news_list, name="news_list"),
    path("news/categories/", views.public_categories, name="categories_list"),
    path("news/<slug:slug>/", views.public_news_detail, name="news_detail"),

    # Admin
    path("admin/stats/", views.admin_stats, name="admin_stats"),
    path("admin/users/", views.admin_users, name="admin_users"),
    path("admin/lines/", views.admin_metro_lines, name="admin_metro_lines"),
    path("admin/news/", views.admin_news_list, name="admin_news_list"),
    path("admin/news/create/", views.admin_news_create, name="admin_news_create"),
    path("admin/news/<uuid:pk>/", views.admin_news_detail, name="admin_news_detail"),
    path("upload/", views.upload_media, name="upload_media"),
]
