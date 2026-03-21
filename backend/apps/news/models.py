import uuid
from django.db import models

class NewsCategory(models.Model):
    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "news_categories"
        managed = False

class News(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    category = models.ForeignKey(NewsCategory, on_delete=models.SET_NULL, null=True, db_column="category_id")
    title = models.CharField(max_length=500)
    summary = models.TextField(null=True, blank=True)
    thumbnail_url = models.TextField(null=True, blank=True)
    slug = models.CharField(max_length=500, unique=True, null=True, blank=True)
    is_published = models.BooleanField(default=False)
    published_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "news"
        managed = False
