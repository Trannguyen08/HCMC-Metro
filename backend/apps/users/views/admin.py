from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.core.cache import cache
from core.permissions import IsAdminUser
from core.pagination import StandardResultsSetPagination
from apps.users.models import User
from apps.users.serializers.user import AdminUserSerializer

@api_view(["GET"])
@permission_classes([IsAdminUser])
def admin_users(request):
    page = request.query_params.get('page', 1)
    cache_key = f"admin_users_list:page_{page}"
    
    # Try to get from cache
    cached_data = cache.get(cache_key)
    if cached_data:
        return Response(cached_data)

    # Fetch from DB
    users = User.objects.all().select_related('category').order_by("-created_at")
    paginator = StandardResultsSetPagination()
    result_page = paginator.paginate_queryset(users, request)
    serializer = AdminUserSerializer(result_page, many=True)
    
    response_data = paginator.get_paginated_response(serializer.data).data
    
    # Cache for 5 minutes
    cache.set(cache_key, response_data, timeout=300)
    
    return Response(response_data)

# Helper to invalidate cache - to be used in other admin views (update/delete)
def invalidate_user_list_cache():
    for i in range(1, 51):
        cache.delete(f"admin_users_list:page_{i}")
