import uuid
from django.db import models


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
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "users"
        managed = False

    def __str__(self):
        return self.email


class OAuthAccount(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="oauth_accounts", db_column="user_id")
    provider = models.CharField(max_length=50)
    provider_id = models.CharField(max_length=255)
    access_token = models.TextField(null=True, blank=True)
    refresh_token = models.TextField(null=True, blank=True)
    token_expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "oauth_accounts"
        managed = False
        unique_together = [("provider", "provider_id")]


# --- METRO SYSTEM ---

class MetroLine(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True)
    color = models.CharField(max_length=10, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "metro_lines"
        managed = False


class Station(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=20, unique=True)
    line = models.ForeignKey(MetroLine, on_delete=models.SET_NULL, null=True, db_column="line_id")
    address = models.CharField(max_length=500, null=True, blank=True)
    latitude = models.DecimalField(max_digits=10, decimal_places=8, null=True, blank=True)
    longitude = models.DecimalField(max_digits=11, decimal_places=8, null=True, blank=True)
    sequence_order = models.IntegerField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    image_url = models.TextField(null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "stations"
        managed = False


class Train(models.Model):
    train_number = models.CharField(max_length=50, unique=True)
    line = models.ForeignKey(MetroLine, on_delete=models.SET_NULL, null=True, db_column="line_id")
    capacity = models.IntegerField(null=True, blank=True)
    status = models.CharField(max_length=30, default="active")
    manufacture_year = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "trains"
        managed = False


# --- TICKETING ---

class TicketType(models.Model):
    type = models.CharField(max_length=50) # ENUM in SQL
    name = models.CharField(max_length=100)
    duration_days = models.IntegerField()
    price = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.TextField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "ticket_types"
        managed = False


class Ticket(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, db_column="user_id")
    ticket_type = models.ForeignKey(TicketType, on_delete=models.PROTECT, db_column="ticket_type_id")
    qr_code = models.TextField(unique=True, null=True, blank=True)
    status = models.CharField(max_length=30, default="pending") # ENUM in SQL
    valid_from = models.DateField()
    valid_until = models.DateField()
    from_station = models.ForeignKey(Station, on_delete=models.SET_NULL, null=True, related_name="tickets_from", db_column="from_station_id")
    to_station = models.ForeignKey(Station, on_delete=models.SET_NULL, null=True, related_name="tickets_to", db_column="to_station_id")
    price_paid = models.DecimalField(max_digits=12, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "tickets"
        managed = False


class Payment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, db_column="ticket_id")
    user = models.ForeignKey(User, on_delete=models.CASCADE, db_column="user_id")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    method = models.CharField(max_length=50, null=True, blank=True)
    status = models.CharField(max_length=30, default="pending")
    transaction_ref = models.CharField(max_length=255, unique=True, null=True, blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "payments"
        managed = False


# --- NEWS & AMENITIES ---

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


class AmenityType(models.Model):
    name = models.CharField(max_length=100)
    icon_url = models.TextField(null=True, blank=True)

    class Meta:
        db_table = "amenity_types"
        managed = False


class Amenity(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    station = models.ForeignKey(Station, on_delete=models.CASCADE, db_column="station_id")
    amenity_type = models.ForeignKey(AmenityType, on_delete=models.SET_NULL, null=True, db_column="amenity_type_id")
    name = models.CharField(max_length=255)
    address = models.CharField(max_length=500, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "amenities"
        managed = False
