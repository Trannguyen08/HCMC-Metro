from rest_framework import serializers
from apps.news.models import News, NewsCategory

class NewsCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = NewsCategory
        fields = ["id", "name", "slug"]


class NewsSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source="category.name")

    class Meta:
        model = News
        fields = [
            "id",
            "category",
            "category_name",
            "title",
            "summary",
            "thumbnail_url",
            "is_published",
            "published_at",
            "slug",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
