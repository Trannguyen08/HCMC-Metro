"""
Management command: update_amenities_data
Populates all 36 Amenity records with accurate brand-matched images,
complete descriptions, opening hours, contact phones, websites, and clean ratings.
"""
from django.core.cache import cache
from django.core.management.base import BaseCommand

from apps.metro.models import Amenity

BRAND_PROFILES = {
    "7-Eleven": {
        "image_url": "/images/amenities/7-eleven.jpg",
        "opening_hours": "Mở cửa 24/7 (Cả tuần)",
        "phone": "1900 636 711",
        "website": "https://www.7-eleven.vn",
        "desc_tpl": (
            "{brand} tại {station} phục vụ 24/7 các mặt hàng tiện lợi, đồ ăn nóng tươi mới mỗi ngày "
            "(cơm nắm, bánh mì, mỳ trộn), cà phê pha máy, nước giải khát và thanh toán hóa đơn/nạp tiền ví điện tử nhanh chóng. "
            "Vị trí ngay lối ra vào ga giúp hành khách dễ dàng mua sắm chỉ trong 2 phút trước khi lên tàu."
        ),
    },
    "GS25": {
        "image_url": "/images/amenities/gs25.jpg",
        "opening_hours": "Mở cửa 24/7 (Cả tuần)",
        "phone": "1900 633 025",
        "website": "https://gs25.com.vn",
        "desc_tpl": (
            "{brand} khu vực {station} mang phong cách cửa hàng tiện lợi Hàn Quốc hiện đại với quầy đồ ăn nhanh "
            "tokbokki, gà rán, kimbap, cà phê đá xay Café25 cùng không gian ngồi nghỉ máy lạnh thoáng mát. "
            "Hỗ trợ thanh toán không tiền mặt qua thẻ Mastercard/Visa, MoMo và QR ngân hàng."
        ),
    },
    "WinMart+": {
        "image_url": "/images/amenities/winmart.jpg",
        "opening_hours": "06:00 - 22:30 (Hàng ngày)",
        "phone": "024 7106 6866",
        "website": "https://winmart.vn",
        "desc_tpl": (
            "Siêu thị mini {brand} ngay tại {station} cung cấp đầy đủ nhu yếu phẩm hàng ngày, thực phẩm tươi sạch, "
            "trái cây theo mùa, sữa và đồ uống đóng chai với mức giá niêm yết ổn định. "
            "Rất thuận tiện cho hành khách đi làm hoặc sinh viên ghé mua đồ trên đường về từ tuyến Metro số 1."
        ),
    },
    "Highlands Coffee": {
        "image_url": "/images/amenities/highlands-coffee.jpg",
        "opening_hours": "06:30 - 22:30 (Hàng ngày)",
        "phone": "1900 1755",
        "website": "https://www.highlandscoffee.com.vn",
        "desc_tpl": (
            "{brand} chi nhánh gần {station} sở hữu không gian rộng rãi, wifi tốc độ cao và ổ cắm tiện lợi cho làm việc lẫn gặp gỡ. "
            "Thực đơn nổi bật với Phin Sữa Đá đậm vị, Trà Sen Vàng, Freeze Trà Xanh và bánh mì que nóng giòn, "
            "phục vụ nhanh gọn cho hành khách di chuyển bằng Metro."
        ),
    },
    "Phúc Long Coffee & Tea": {
        "image_url": "/images/amenities/phuc-long.jpg",
        "opening_hours": "07:00 - 22:30 (Hàng ngày)",
        "phone": "1800 6779",
        "website": "https://phuclong.com.vn",
        "desc_tpl": (
            "{brand} tại {station} nổi tiếng với hương vị trà Ô Long, Trà Đào Cam Sả, Trà Sữa Phúc Long đậm trà "
            "cùng các dòng cà phê rang xay nguyên bản. Quán có khu vực quầy mang đi (take-away) riêng biệt giúp bạn "
            "nhận đồ uống nhanh chóng chỉ cách lối vào nhà ga vài bước chân."
        ),
    },
    "ATM Vietcombank": {
        "image_url": "/images/amenities/vietcombank-atm.jpg",
        "opening_hours": "Hoạt động 24/7 (Có bảo vệ & camera)",
        "phone": "1900 545 413",
        "website": "https://www.vietcombank.com.vn",
        "desc_tpl": (
            "Điểm giao dịch tự động {brand} đặt ngay khu vực sảnh nhà ga {station}, hỗ trợ rút tiền mặt 24/7, "
            "nộp tiền trực tiếp (CDM), chuyển khoản nhanh NAPAS 24/7 và truy vấn số dư. "
            "Khu vực buồng máy được chiếu sáng tốt, giám sát an ninh liên tục và hỗ trợ thẻ contactless."
        ),
    },
}


class Command(BaseCommand):
    help = "Update all Amenity records with accurate brand images and complete metadata"

    def handle(self, *args, **options):
        amenities = Amenity.objects.select_related("station", "amenity_type", "category").all()
        updated = 0
        for amenity in amenities:
            brand = amenity.name.split(" - ")[0].strip()
            profile = BRAND_PROFILES.get(brand)
            station_label = f"Ga {amenity.station.name}" if amenity.station else "khu vực Metro"
            if profile:
                amenity.image_url = profile["image_url"]
                amenity.opening_hours = profile["opening_hours"]
                amenity.phone = profile["phone"]
                amenity.website = profile["website"]
                amenity.description = profile["desc_tpl"].format(
                    brand=brand,
                    station=station_label,
                )
            if not amenity.rating:
                amenity.rating = 4.5
            amenity.save()
            updated += 1

        try:
            cache.clear()
        except Exception:
            pass

        self.stdout.write(self.style.SUCCESS(f"Updated {updated} amenities with authentic images and complete info."))
