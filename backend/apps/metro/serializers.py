from rest_framework import serializers

from apps.metro.models import Amenity, AmenityType, Station, Train, MetroLine


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
    nameEn = serializers.SerializerMethodField()
    line = serializers.SerializerMethodField()

    class Meta:
        model = Station
        fields = ["id", "name", "nameEn", "line"]

    def get_nameEn(self, obj: Station) -> str:
        return obj.name

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
    class Meta:
        model = Station
        fields = [
            "id", "name", "code", "line", "address", 
            "latitude", "longitude", "sequence_order", 
            "is_active", "image_url", "description", "created_at"
        ]
        read_only_fields = ["id", "created_at"]

class AdminTrainSerializer(serializers.ModelSerializer):
    class Meta:
        model = Train
        fields = [
            "id", "train_number", "line", "capacity", 
            "status", "is_active", "manufacture_year", "created_at"
        ]
        read_only_fields = ["id", "created_at"]
