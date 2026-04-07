import uuid
from django.db import models

class UserCategory(models.Model):
    name = models.CharField(max_length=100)
    slug = models.CharField(max_length=50, unique=True)
    discount_rate = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    description = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "user_categories"
        managed = False

    def __str__(self):
        return self.name

class User(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(max_length=255, unique=True)
    password_hash = models.TextField(null=True, blank=True)
    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20, null=True, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    avatar_url = models.TextField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    is_admin = models.BooleanField(default=False)
    email_verified = models.BooleanField(default=False)
    category = models.ForeignKey(
        UserCategory, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        db_column="category_id",
        related_name="users"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "users"
        managed = False

    def __str__(self):
        return self.email

    @property
    def is_authenticated(self):
        return True

    @property
    def is_anonymous(self):
        return False
