from django.urls import path
from apps.news.views import news

urlpatterns = [
    # Public
    path("", news.public_news_list, name="news_list_root"),
    path("categories/", news.public_categories, name="categories_list_root"),
    path("<slug:slug>/", news.public_news_detail, name="news_detail_root"),
    path("news/", news.public_news_list, name="news_list"),
    path("news/categories/", news.public_categories, name="categories_list"),
    path("news/<slug:slug>/", news.public_news_detail, name="news_detail"),

    # Admin
    path("admin/news/", news.admin_news_list, name="admin_news_list"),
    path("admin/news/create/", news.admin_news_create, name="admin_news_create"),
    path("admin/news/<uuid:pk>/", news.admin_news_detail, name="admin_news_detail"),
]
