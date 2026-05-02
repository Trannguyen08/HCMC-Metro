from rest_framework import serializers

from apps.metro.models import Amenity, AmenityType, BusStop, MetroLine, Station, Train


AMENITY_TYPE_ALIASES: dict[str, tuple[str, ...]] = {
    "cafe": ("cafe", "ca phe", "cà phê", "coffee"),
    "restaurant": ("restaurant", "nha hang", "nhà hàng", "food"),
    "shopping": (
        "shopping",
        "mua sam",
        "mua sắm",
        "sieu thi",
        "siêu thị",
        "trung tam thuong mai",
        "trung tâm thương mại",
        "cua hang tien loi",
        "cửa hàng tiện lợi",
    ),
    "hotel": ("hotel", "khach san", "khách sạn"),
    "service": (
        "service",
        "dich vu",
        "dịch vụ",
        "atm",
        "ngan hang",
        "ngân hàng",
        "benh vien",
        "bệnh viện",
        "phong kham",
        "phòng khám",
        "bai giu xe",
        "bãi giữ xe",
        "tram xe buyt",
        "trạm xe buýt",
        "cong vien",
        "công viên",
    ),
}


def normalize_text(value: str | None) -> str:
    if not value:
        return ""

    normalized = value.strip().lower()
    replacements = {
        "à": "a",
        "á": "a",
        "ạ": "a",
        "ả": "a",
        "ã": "a",
        "ă": "a",
        "ằ": "a",
        "ắ": "a",
        "ặ": "a",
        "ẳ": "a",
        "ẵ": "a",
        "â": "a",
        "ầ": "a",
        "ấ": "a",
        "ậ": "a",
        "ẩ": "a",
        "ẫ": "a",
        "đ": "d",
        "è": "e",
        "é": "e",
        "ẹ": "e",
        "ẻ": "e",
        "ẽ": "e",
        "ê": "e",
        "ề": "e",
        "ế": "e",
        "ệ": "e",
        "ể": "e",
        "ễ": "e",
        "ì": "i",
        "í": "i",
        "ị": "i",
        "ỉ": "i",
        "ĩ": "i",
        "ò": "o",
        "ó": "o",
        "ọ": "o",
        "ỏ": "o",
        "õ": "o",
        "ô": "o",
        "ồ": "o",
        "ố": "o",
        "ộ": "o",
        "ổ": "o",
        "ỗ": "o",
        "ơ": "o",
        "ờ": "o",
        "ớ": "o",
        "ợ": "o",
        "ở": "o",
        "ỡ": "o",
        "ù": "u",
        "ú": "u",
        "ụ": "u",
        "ủ": "u",
        "ũ": "u",
        "ư": "u",
        "ừ": "u",
        "ứ": "u",
        "ự": "u",
        "ử": "u",
        "ữ": "u",
        "ỳ": "y",
        "ý": "y",
        "ỵ": "y",
        "ỷ": "y",
        "ỹ": "y",
    }
    for source, target in replacements.items():
        normalized = normalized.replace(source, target)
    return normalized


def map_amenity_type(name: str | None) -> str:
    normalized_name = normalize_text(name)
    for key, aliases in AMENITY_TYPE_ALIASES.items():
        if any(alias in normalized_name for alias in aliases):
            return key
    return "service"


class StationSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="code", read_only=True)
    line = serializers.SerializerMethodField()

    class Meta:
        model = Station
        fields = ["id", "name", "line"]

    def get_line(self, obj: Station) -> str | None:
        return getattr(obj.line, "code", None)


class AmenitySerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    type = serializers.SerializerMethodField()
    stationId = serializers.CharField(source="station.code", read_only=True)
    stationName = serializers.CharField(source="station.name", read_only=True)
    imageUrl = serializers.CharField(source="image_url", read_only=True, allow_null=True)
    distanceMeters = serializers.IntegerField(source="distance_meters", read_only=True, allow_null=True)
    openingHours = serializers.CharField(source="opening_hours", read_only=True, allow_null=True)
    rating = serializers.FloatField(read_only=True, allow_null=True)

    class Meta:
        model = Amenity
        fields = [
            "id",
            "name",
            "slug",
            "type",
            "address",
            "stationId",
            "stationName",
            "distanceMeters",
            "imageUrl",
            "description",
            "rating",
            "openingHours",
            "phone",
            "website",
        ]

    def get_type(self, obj: Amenity) -> str:
        return map_amenity_type(getattr(obj.amenity_type, "name", ""))


class AmenityTypeOptionSerializer(serializers.ModelSerializer):
    category = serializers.SerializerMethodField()

    class Meta:
        model = AmenityType
        fields = ["id", "name", "category"]

    def get_category(self, obj: AmenityType) -> str:
        return map_amenity_type(obj.name)


class AdminAmenitySerializer(serializers.ModelSerializer):
    category = serializers.SerializerMethodField(read_only=True)
    station_code = serializers.CharField(source="station.code", read_only=True)
    station_name = serializers.CharField(source="station.name", read_only=True)
    amenity_type_name = serializers.CharField(source="amenity_type.name", read_only=True)
    station = serializers.SlugRelatedField(
        slug_field="code",
        queryset=Station.objects.filter(is_active=True),
        write_only=True,
    )
    amenity_type = serializers.PrimaryKeyRelatedField(
        queryset=AmenityType.objects.all(),
        write_only=True,
    )

    class Meta:
        model = Amenity
        fields = [
            "id",
            "name",
            "slug",
            "category",
            "address",
            "station",
            "station_code",
            "station_name",
            "amenity_type",
            "amenity_type_name",
            "distance_meters",
            "image_url",
            "description",
            "rating",
            "opening_hours",
            "phone",
            "website",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_category(self, obj: Amenity) -> str:
        return map_amenity_type(getattr(obj.amenity_type, "name", ""))

class AdminStationSerializer(serializers.ModelSerializer):
    line_name = serializers.SerializerMethodField()

    class Meta:
        model = Station
        fields = [
            "id", "name", "code", "line", "line_name", "address",
            "latitude", "longitude", "sequence_order", 
            "is_active", "image_url", "description", "created_at"
        ]
        read_only_fields = ["id", "created_at", "line_name"]

    def get_line_name(self, obj):
        if obj.line:
            return obj.line.name
        return None


class AdminBusStopSerializer(serializers.ModelSerializer):
    station_code = serializers.CharField(source="station.code", read_only=True)
    station_name = serializers.CharField(source="station.name", read_only=True)
    station = serializers.SlugRelatedField(
        slug_field="code",
        queryset=Station.objects.filter(is_active=True),
        write_only=True,
    )

    class Meta:
        model = BusStop
        fields = [
            "id",
            "name",
            "code",
            "station",
            "station_code",
            "station_name",
            "address",
            "latitude",
            "longitude",
            "routes",
            "distance_to_station",
            "stop_type",
            "note",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "station_code", "station_name"]

class TrainSerializer(serializers.ModelSerializer):
    class Meta:
        model = Train
        fields = ["id", "train_number", "status"]


class AdminTrainSerializer(serializers.ModelSerializer):
    current_station_name = serializers.SerializerMethodField()
    next_station_name = serializers.SerializerMethodField()
    next_station = serializers.SerializerMethodField()
    line_name = serializers.SerializerMethodField()
    route_label = serializers.SerializerMethodField()

    class Meta:
        model = Train
        fields = [
            "id", "train_number", "line", "line_name", "capacity",
            "direction", "current_station", "current_station_name",
            "next_station", "next_station_name", "route_label",
            "status", "is_active", "manufacture_year", "created_at"
        ]
        read_only_fields = [
            "id", "created_at", "current_station_name", 
            "next_station", "next_station_name", "line_name", "route_label"
        ]

    def get_current_station_name(self, obj):
        if obj.current_station:
            return obj.current_station.name
        return None

    def get_line_name(self, obj):
        if obj.line:
            return obj.line.name
        return None

    def get_next_station(self, obj):
        if not obj.current_station or not obj.line:
            return None
        
        current_order = obj.current_station.sequence_order
        if current_order is None:
            return None

        # Find next station based on direction
        if obj.direction == "outbound":
            next_st = Station.objects.filter(
                line=obj.line, 
                sequence_order__gt=current_order,
                is_active=True
            ).order_by("sequence_order").first()
        else:
            next_st = Station.objects.filter(
                line=obj.line, 
                sequence_order__lt=current_order,
                is_active=True
            ).order_by("-sequence_order").first()
            
        return next_st.id if next_st else None

    def get_next_station_name(self, obj):
        next_id = self.get_next_station(obj)
        if next_id:
            return Station.objects.get(id=next_id).name
        return None

    def get_route_label(self, obj):
        if not obj.line:
            return "N/A"
        
        stations = list(obj.line.stations.filter(is_active=True).order_by("sequence_order"))
        if len(stations) < 2:
            return obj.line.name

        first_st = stations[0].name
        last_st = stations[-1].name

        if obj.direction == "outbound":
            return f"{first_st} → {last_st}"
        return f"{last_st} → {first_st}"


class AdminTrainStationLogSerializer(serializers.ModelSerializer):
    train_number = serializers.CharField(source="train.train_number", read_only=True)
    station_name = serializers.CharField(source="station.name", read_only=True)
    direction_display = serializers.CharField(source="get_direction_display", read_only=True)

    class Meta:
        from apps.metro.models import TrainStationLog
        model = TrainStationLog
        fields = [
            "id", "train_number", "station_name", "direction", 
            "direction_display", "trip_run", "arrived_at", 
            "departed_at", "created_at"
        ]
        read_only_fields = fields



class AdminTrainStationLogSerializer(serializers.ModelSerializer):
    train_number = serializers.CharField(source="train.train_number", read_only=True)
    station_name = serializers.CharField(source="station.name", read_only=True)
    direction_display = serializers.CharField(source="get_direction_display", read_only=True)

    class Meta:
        from apps.metro.models import TrainStationLog
        model = TrainStationLog
        fields = [
            "id", "train_number", "station_name", "direction", 
            "direction_display", "trip_run", "arrived_at", 
            "departed_at", "created_at"
        ]
        read_only_fields = fields
