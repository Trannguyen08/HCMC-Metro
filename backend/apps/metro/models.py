from django.db import models

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

class AmenityType(models.Model):
    name = models.CharField(max_length=100)
    icon_url = models.TextField(null=True, blank=True)

    class Meta:
        db_table = "amenity_types"
        managed = False

import uuid
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
