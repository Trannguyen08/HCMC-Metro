from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.news.services.news_service import NewsService
from apps.news.serializers.news import NewsSerializer, NewsCategorySerializer
from core.permissions import IsAdminUser

news_service = NewsService()

@api_view(["GET"])
@permission_classes([AllowAny])
def public_news_list(request):
    category = request.query_params.get("category")
    search = request.query_params.get("search")
    exclude_id = request.query_params.get("exclude")
    offset = request.query_params.get("offset", 0)
    limit = request.query_params.get("limit", 10)
    
    news = news_service.get_published_news(
        category=category, 
        search=search, 
        exclude_id=exclude_id, 
        offset=offset, 
        limit=limit
    )
    serializer = NewsSerializer(news, many=True)
    return Response(serializer.data)

@api_view(["GET"])
@permission_classes([AllowAny])
def public_news_detail(request, slug):
    news = news_service.get_news_detail_by_slug(slug)
    if not news:
        return Response({"detail": "Tin tức không tồn tại."}, status=status.HTTP_404_NOT_FOUND)
    
    serializer = NewsSerializer(news)
    return Response(serializer.data)

@api_view(["GET"])
@permission_classes([IsAdminUser])
def admin_news_list(request):
    news = news_service.get_all_news_admin()
    serializer = NewsSerializer(news, many=True)
    return Response(serializer.data)

@api_view(["POST"])
@permission_classes([IsAdminUser])
def admin_news_create(request):
    serializer = NewsSerializer(data=request.data)
    if serializer.is_valid():
        news_service.create_news(serializer.validated_data)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(["GET", "PUT", "DELETE"])
@permission_classes([IsAdminUser])
def admin_news_detail(request, pk):
    news = news_service.get_news_by_id(pk)
    if not news:
        return Response({"detail": "Không tìm thấy tin tức."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        serializer = NewsSerializer(news)
        return Response(serializer.data)

    elif request.method == "PUT":
        serializer = NewsSerializer(news, data=request.data, partial=True)
        if serializer.is_valid():
            news_service.update_news(news, serializer.validated_data)
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == "DELETE":
        news_service.delete_news(news)
        return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(["GET"])
@permission_classes([AllowAny])
def public_categories(request):
    categories = news_service.get_all_categories()
    serializer = NewsCategorySerializer(categories, many=True)
    return Response(serializer.data)
