from .common import health, IsAdminUser
from .auth import register, login, verify_register_otp, google_login, logout, me
from .news import (
    public_news_list, 
    public_news_detail, 
    admin_news_list, 
    admin_news_create, 
    admin_news_detail,
    public_categories
)
from .admin import admin_stats, admin_users, admin_metro_lines
from .media import upload_media
