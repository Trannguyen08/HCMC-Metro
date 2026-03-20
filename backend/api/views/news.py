from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from ..models import News, NewsCategory
from ..serializers import (
    NewsSerializer,
    NewsCategorySerializer,
)
from .common import IsAdminUser

@api_view(["GET"])
@permission_classes([AllowAny])
def public_news_list(request):
    """List published news."""
    category_id = request.query_params.get("category")
    exclude_id = request.query_params.get("exclude")
    limit = request.query_params.get("limit")
    
    news = News.objects.filter(is_published=True).order_by("-published_at")
    
    if category_id:
        news = news.filter(category_id=category_id)
        
    if exclude_id:
        try:
            news = news.exclude(id=exclude_id)
        except ValueError:
            pass
            
    if limit and limit.isdigit():
        news = news[:int(limit)]
    
    serializer = NewsSerializer(news, many=True)
    return Response(serializer.data)

@api_view(["GET"])
@permission_classes([AllowAny])
def public_news_detail(request, slug):
    """Get news detail by slug."""
    news = News.objects.filter(slug=slug, is_published=True).first()
    if not news:
        return Response({"detail": "Tin tức không tồn tại."}, status=status.HTTP_404_NOT_FOUND)
    
    serializer = NewsSerializer(news)
    return Response(serializer.data)

@api_view(["GET"])
@permission_classes([IsAdminUser])
def admin_news_list(request):
    """List all news for admin."""
    news = News.objects.all().order_by("-created_at")
    serializer = NewsSerializer(news, many=True)
    return Response(serializer.data)

@api_view(["POST"])
@permission_classes([IsAdminUser])
def admin_news_create(request):
    """Create a new news item."""
    serializer = NewsSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(["GET", "PUT", "DELETE"])
@permission_classes([IsAdminUser])
def admin_news_detail(request, pk):
    """Retrieve, update or delete a news item."""
    try:
        news = News.objects.get(pk=pk)
    except News.DoesNotExist:
        return Response({"detail": "Không tìm thấy tin tức."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        serializer = NewsSerializer(news)
        return Response(serializer.data)

    elif request.method == "PUT":
        serializer = NewsSerializer(news, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == "DELETE":
        news.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(["GET"])
@permission_classes([AllowAny])
def public_categories(request):
    """List all news categories."""
    categories = NewsCategory.objects.all()
    serializer = NewsCategorySerializer(categories, many=True)
    return Response(serializer.data)
