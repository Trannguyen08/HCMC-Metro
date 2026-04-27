import uuid

from django.db import models


class MetroLine(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True)
    color = models.CharField(max_length=10, null=True, blank=True)
    color_hex = models.CharField(max_length=10, null=True, blank=True)
    stroke_weight = models.IntegerField(null=True, blank=True)
    geojson_coordinates = models.JSONField(null=True, blank=True)
    status = models.CharField(max_length=30, default="active")
    description = models.TextField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "metro_lines"
        managed = True


class Station(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=20, unique=True)
    line = models.ForeignKey(
        MetroLine,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column="line_id",
        related_name="stations",
    )
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
        managed = True


class Train(models.Model):
    train_number = models.CharField(max_length=50, unique=True)
    line = models.ForeignKey(MetroLine, on_delete=models.SET_NULL, null=True, db_column="line_id")
    capacity = models.IntegerField(null=True, blank=True)
    status = models.CharField(max_length=30, default="active")
    manufacture_year = models.IntegerField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    direction = models.CharField(
        max_length=20, 
        choices=[("outbound", "Lượt đi"), ("inbound", "Lượt về")], 
        default="outbound"
    )
    is_simulated = models.BooleanField(default=True)
    current_station = models.ForeignKey(
        Station, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name="current_trains",
        db_column="current_station_id"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "trains"
        managed = True


class AmenityCategory(models.Model):
    name = models.CharField(max_length=100)
    slug = models.CharField(max_length=50, unique=True)
    icon_svg = models.TextField(null=True, blank=True)
    color_hex = models.CharField(max_length=10, null=True, blank=True)
    bg_color_hex = models.CharField(max_length=10, null=True, blank=True)
    sort_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "amenity_categories"
        managed = True


class AmenityType(models.Model):
    name = models.CharField(max_length=100)
    icon_url = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "amenity_types"
        managed = True


class Amenity(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    station = models.ForeignKey(
        Station,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        db_column="station_id",
        related_name="amenities",
    )
    amenity_type = models.ForeignKey(
        AmenityType,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column="amenity_type_id",
        related_name="legacy_amenities",
    )
    category = models.ForeignKey(
        AmenityCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column="category_id",
        related_name="amenities",
    )
    slug = models.CharField(max_length=300, null=True, blank=True)
    name = models.CharField(max_length=255)
    distance_meters = models.IntegerField(null=True, blank=True)
    address = models.CharField(max_length=500, null=True, blank=True)
    latitude = models.DecimalField(max_digits=10, decimal_places=8, null=True, blank=True)
    longitude = models.DecimalField(max_digits=11, decimal_places=8, null=True, blank=True)
    image_url = models.TextField(null=True, blank=True)
    opening_hours = models.CharField(max_length=255, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    phone = models.CharField(max_length=30, null=True, blank=True)
    website = models.TextField(null=True, blank=True)
    rating = models.DecimalField(max_digits=2, decimal_places=1, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "amenities"
        managed = True


class BusStop(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, unique=True)
    latitude = models.DecimalField(max_digits=10, decimal_places=8)
    longitude = models.DecimalField(max_digits=11, decimal_places=8)
    address = models.CharField(max_length=500, null=True, blank=True)
    routes = models.JSONField(null=True, blank=True)
    station = models.ForeignKey(
        Station,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column="station_id",
        related_name="bus_stops",
    )
    distance_to_station = models.IntegerField(null=True, blank=True)
    stop_type = models.CharField(max_length=120, null=True, blank=True)
    note = models.TextField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "bus_stops"
        managed = True
