from rest_framework import serializers
from apps.users.models import User, UserCategory

class UserCategoryBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserCategory
        fields = ['id', 'name', 'slug']

class AdminUserSerializer(serializers.ModelSerializer):
    category = UserCategoryBriefSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'full_name', 'phone', 'date_of_birth', 
            'avatar_url', 'is_active', 'is_admin', 'email_verified', 
            'category', 'created_at'
        ]
