import random
import uuid
import json
import os
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.utils import timezone
import hashlib
from apps.metro.models import MetroLine, Station, Train, Amenity, AmenityCategory, AmenityType, BusStop
from apps.users.models.user import User, UserCategory
from apps.ticketing.models import TicketType
from apps.news.models import News, NewsCategory
from apps.feedback.models import Feedback
from pathlib import Path

class Command(BaseCommand):
    help = "Seed database with high-quality HCMC Metro data for digital map and simulation"

    def handle(self, *args, **options):
        self.stdout.write("Cleaning old data...")
        self.clean_data()

        self.stdout.write("Seeding high-quality data...")
        
        # 1. Metro Line & Stations
        line1 = self.seed_line_1()
        stations = self.seed_stations(line1)

        # 2. Amenities (Real brands and accurate locations)
        self.seed_amenities(stations)

        # 3. Trains (Simulation: 3 outbound, 3 inbound)
        self.seed_trains(line1, stations)

        # 4. Ticket Types & Categories
        self.seed_ticketing_data()

        # 5. Bus Stops (Import from JSON)
        self.seed_bus_stops(stations)

        # 5. Other data (Users, News, Feedback)
        self.seed_extras(stations)

        self.stdout.write(self.style.SUCCESS("Successfully seeded high-quality database!"))

    def clean_data(self):
        from apps.ticketing.models import Ticket
        Ticket.objects.all().delete()
        Feedback.objects.all().delete()
        Amenity.objects.all().delete()
        BusStop.objects.all().delete()
        Train.objects.all().delete()
        TicketType.objects.all().delete()
        UserCategory.objects.all().delete()
        Station.objects.all().delete()
        MetroLine.objects.all().delete()
        News.objects.all().delete()
        
        # Keep real users, only delete those we seeded
        admin_email = os.getenv("ADMIN_EMAIL", "admin@metrohcm.vn")
        User.objects.filter(email=admin_email).delete()
        User.objects.filter(email__contains='@example.com').delete()

    def hash_password(self, password: str) -> str:
        # Match the logic in apps.users.services.auth_service
        salt = os.urandom(16).hex()
        hashed = hashlib.sha256(f"{salt}{password}".encode()).hexdigest()
        return f"{salt}:{hashed}"

    def seed_line_1(self):
        # High-detail coordinates for Line 1 (Following real track curves)
        # Format: [Longitude, Latitude]
        coords = [
            [106.6974, 10.7712], # Ben Thanh
            [106.6995, 10.7735], # Curve along Le Loi
            [106.7016, 10.7758], # Opera House
            [106.7040, 10.7800], # Curve to Ton Duc Thang
            [106.7067, 10.7842], # Ba Son
            [106.7100, 10.7900], # Crossing river
            [106.7135, 10.7963], # Van Thanh
            [106.7180, 10.7975], # Approaching Bridge
            [106.7218, 10.7989], # Tan Cang
            [106.7280, 10.8010], # Curve to Vo Nguyen Giap
            [106.7360, 10.8030], # Thao Dien
            [106.7432, 10.8055], # An Phu
            [106.7500, 10.8085], # Curve Rach Chiec
            [106.7578, 10.8123], # Rach Chiec
            [106.7630, 10.8160], # Along Xa Lo Ha Noi
            [106.7689, 10.8205], # Phuoc Long
            [106.7725, 10.8245], # Curve
            [106.7765, 10.8289], # Binh Thai
            [106.7820, 10.8340], # Along Xa Lo Ha Noi
            [106.7865, 10.8389], # Thu Duc
            [106.7940, 10.8460], # Curve to High Tech
            [106.8012, 10.8523], # High Tech Park
            [106.8065, 10.8565], # Suoi Tien
            [106.8123, 10.8601]  # Depot area
        ]
        
        line, _ = MetroLine.objects.get_or_create(
            code="L1",
            defaults={
                "name": "Tuyến số 1 (Bến Thành - Suối Tiên)",
                "color": "Blue",
                "color_hex": "#0066CC",
                "stroke_weight": 5,
                "status": "active",
                "geojson_coordinates": {"type": "LineString", "coordinates": coords},
                "description": "Tuyến đường sắt đô thị đầu tiên của TP.HCM kết nối trung tâm với cửa ngõ phía Đông."
            }
        )
        return line

    def seed_stations(self, line):
        stations_data = [
            ("Bến Thành", "BT", 10.7712, 106.6974, "Quảng trường Quách Thị Trang, Quận 1"),
            ("Nhà hát Thành phố", "NHTP", 10.7758, 106.7016, "Công trường Lam Sơn, Quận 1"),
            ("Ba Son", "BS", 10.7842, 106.7067, "Số 2 Tôn Đức Thắng, Quận 1"),
            ("Văn Thánh", "VT", 10.7963, 106.7135, "Khu du lịch Văn Thánh, Bình Thạnh"),
            ("Tân Cảng", "TC", 10.7989, 106.7218, "Dưới chân cầu Sài Gòn, Bình Thạnh"),
            ("Thảo Điền", "TD", 10.8030, 106.7360, "Xa lộ Hà Nội, Thảo Điền, Quận 2"),
            ("An Phú", "AP", 10.8055, 106.7432, "Phường An Phú, Quận 2"),
            ("Rạch Chiếc", "RC", 10.8123, 106.7578, "Phường An Phú, Quận 2"),
            ("Phước Long", "PL", 10.8205, 106.7689, "Trường Thọ, Thủ Đức"),
            ("Bình Thái", "BT2", 10.8289, 106.7765, "Trường Thọ, Thủ Đức"),
            ("Thủ Đức", "TDC", 10.8389, 106.7865, "Bình Thọ, Thủ Đức"),
            ("Khu Công nghệ cao", "KCNC", 10.8523, 106.8012, "Tân Phú, Thủ Đức"),
            ("Suối Tiên", "ST", 10.8601, 106.8123, "Tân Phú, Thủ Đức"),
        ]

        stations = []
        for i, (name, code, lat, lon, addr) in enumerate(stations_data):
            s, _ = Station.objects.get_or_create(
                code=code,
                defaults={
                    "name": name,
                    "line": line,
                    "latitude": Decimal(str(lat)),
                    "longitude": Decimal(str(lon)),
                    "address": addr,
                    "sequence_order": i + 1,
                    "is_active": True,
                    "image_url": f"https://picsum.photos/seed/station{code}/800/600"
                }
            )
            stations.append(s)
        return stations

    def seed_amenities(self, stations):
        # Upsert Categories — use update_or_create so icon_svg is always applied
        fnb_svg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>'
        shop_svg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>'
        service_svg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>'
        health_svg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M12 5 9.04 7.96a2.17 2.17 0 0 0 0 3.08v0c.85.85 2.23.85 3.08 0l2.92-2.92"/></svg>'

        cat_fnb, _ = AmenityCategory.objects.update_or_create(
            slug="fnb",
            defaults={"name": "Ăn uống", "color_hex": "#EF4444", "bg_color_hex": "#FEE2E2", "icon_svg": fnb_svg}
        )
        cat_shop, _ = AmenityCategory.objects.update_or_create(
            slug="shopping",
            defaults={"name": "Mua sắm", "color_hex": "#10B981", "bg_color_hex": "#D1FAE5", "icon_svg": shop_svg}
        )
        cat_service, _ = AmenityCategory.objects.update_or_create(
            slug="services",
            defaults={"name": "Dịch vụ", "color_hex": "#3B82F6", "bg_color_hex": "#DBEAFE", "icon_svg": service_svg}
        )
        cat_health, _ = AmenityCategory.objects.update_or_create(
            slug="health",
            defaults={"name": "Y tế", "color_hex": "#F59E0B", "bg_color_hex": "#FEF3C7", "icon_svg": health_svg}
        )

        # Create Types
        type_cafe, _ = AmenityType.objects.get_or_create(name="Quán cà phê")
        type_conv, _ = AmenityType.objects.get_or_create(name="Cửa hàng tiện lợi")
        type_atm, _ = AmenityType.objects.get_or_create(name="ATM")

        brands = [
            ("Highlands Coffee", type_cafe, cat_fnb, "Tầng trệt, Khu vực thương mại"),
            ("7-Eleven", type_conv, cat_shop, "Lối vào số 1"),
            ("GS25", type_conv, cat_shop, "Lối vào số 2"),
            ("ATM Vietcombank", type_atm, cat_service, "Khu vực sảnh chờ"),
            ("Phúc Long Coffee & Tea", type_cafe, cat_fnb, "Khu vực ga đi"),
            ("WinMart+", type_conv, cat_shop, "Tầng B1")
        ]

        for station in stations:
            # Add 2-3 amenities per station
            selected_brands = random.sample(brands, k=random.randint(2, 4))
            for brand_name, b_type, b_cat, loc_desc in selected_brands:
                from django.utils.text import slugify
                Amenity.objects.create(
                    station=station,
                    category=b_cat,
                    amenity_type=b_type,
                    name=f"{brand_name} - Ga {station.name}",
                    slug=slugify(f"{brand_name}-{station.name}"),
                    address=f"{loc_desc}, Ga {station.name}, {station.address}",
                    latitude=station.latitude + Decimal(random.uniform(-0.0005, 0.0005)),
                    longitude=station.longitude + Decimal(random.uniform(-0.0005, 0.0005)),
                    distance_meters=random.randint(10, 50),
                    rating=Decimal(str(round(random.uniform(4.0, 5.0), 1))),
                    image_url=f"https://picsum.photos/seed/brand{brand_name}/400/300",
                    is_active=True
                )

    def seed_trains(self, line, stations):
        # 3 Outbound (Lượt đi: BT -> ST)
        for i in range(1, 4):
            idx = (i-1) * 4 # Spread them out
            Train.objects.create(
                train_number=f"MT-L1-OU-{i}",
                line=line,
                direction="outbound",
                current_station=stations[min(idx, len(stations)-1)],
                status="active",
                is_simulated=True,
                capacity=300
            )
        
        # 3 Inbound (Lượt về: ST -> BT)
        for i in range(1, 4):
            idx = len(stations) - 1 - ((i-1) * 4)
            Train.objects.create(
                train_number=f"MT-L1-IN-{i}",
                line=line,
                direction="inbound",
                current_station=stations[max(idx, 0)],
                status="active",
                is_simulated=True,
                capacity=300
            )

    def seed_bus_stops(self, stations):
        json_path = Path("/app/data/tram_xe_buyt_gan_ga_metro_HCMC.json")
        if not json_path.exists():
            self.stdout.write(self.style.WARNING(f"Bus stop JSON not found at {json_path}. Skipping."))
            return

        with open(json_path, encoding="utf-8") as f:
            data = json.load(f)
            rows = data.get("tram_xe_buyt_gan_ga_metro", [])
            
            stations_map = {s.name.lower(): s for s in stations}
            
            for item in rows:
                raw_station = str(item.get("Ga Metro gần nhất", "")).replace("Ga ", "").strip().lower()
                station = stations_map.get(raw_station)
                
                BusStop.objects.create(
                    code=f"BUS-{int(item['STT']):03d}",
                    name=str(item.get("Tên trạm xe buýt", "")).strip(),
                    latitude=Decimal(str(item.get("Vĩ độ (Latitude)"))),
                    longitude=Decimal(str(item.get("Kinh độ (Longitude)"))),
                    address=str(item.get("Địa chỉ", "")).strip() or None,
                    routes=[r.strip() for r in str(item.get("Tuyến xe buýt kết nối", "")).split(",") if r.strip()],
                    station=station,
                    distance_to_station=item.get("Khoảng cách tới ga (m)"),
                    stop_type=str(item.get("Loại trạm", "")).strip() or None,
                    is_active=True
                )

    def seed_ticketing_data(self):
        # User Categories
        UserCategory.objects.get_or_create(slug="normal", defaults={"name": "Người lớn", "discount_rate": 0})
        UserCategory.objects.get_or_create(slug="hssv", defaults={"name": "Học sinh, Sinh viên", "discount_rate": 0.3})

        # Ticket Types
        ticket_types = [
            ("single", "Vé lượt", 0, 15000, "Vé đi một lượt giữa các ga."),
            ("day", "Vé 1 ngày", 1, 40000, "Đi không giới hạn trong 24h."),
            ("3day", "Vé 3 ngày", 3, 100000, "Đi không giới hạn trong 72h."),
            ("month", "Vé tháng", 30, 300000, "Sử dụng không giới hạn trong 30 ngày."),
        ]

        for t_type, name, duration, price, desc in ticket_types:
            TicketType.objects.get_or_create(
                type=t_type,
                defaults={
                    "name": name,
                    "duration_days": duration,
                    "price": Decimal(price),
                    "description": desc,
                    "is_active": True
                }
            )

    def seed_extras(self, stations):
        # 1. News
        cat_news, _ = NewsCategory.objects.get_or_create(slug="uu-dai", defaults={"name": "Ưu đãi"})
        News.objects.get_or_create(
            title="Khuyến mãi 30% cho Học sinh - Sinh viên",
            defaults={
                "category": cat_news,
                "summary": "HCMC Metro áp dụng chính sách ưu đãi đặc biệt cho đối tượng HSSV. Giảm trực tiếp 30% giá vé khi quét mã tại ga.",
                "slug": "khuyen-mai-30-cho-hoc-sinh-sinh-vien",
                "is_published": True,
                "thumbnail_url": "https://picsum.photos/seed/news1/800/600",
                "published_at": timezone.now()
            }
        )

        # 2. Realistic Users
        user_data = [
            ("nguyenvanan@example.com", "Nguyễn Văn An", "0912345678", "2005-05-15"), # HSSV
            ("tranthisang@example.com", "Trần Thị Sáng", "0987654321", "1990-10-20"), # Normal
            ("lehoangnam@example.com", "Lê Hoàng Nam", "0905123456", "2003-12-12"), # HSSV
            ("phamminhduc@example.com", "Phạm Minh Đức", "0933445566", "1985-01-01"), # Normal
        ]
        
        users = []
        for email, name, phone, dob in user_data:
            u, created = User.objects.get_or_create(
                email=email,
                defaults={
                    "full_name": name,
                    "phone": phone,
                    "date_of_birth": dob,
                    "is_active": True,
                    "password_hash": self.hash_password("password123"),
                    "email_verified": True
                }
            )
            users.append(u)

        # 3. Booking History (Seed some tickets)
        from apps.ticketing.models import Ticket
        ticket_types = list(TicketType.objects.all())
        
        if ticket_types and stations:
            for i, user in enumerate(users):
                # Create 2 tickets for each user
                for j in range(2):
                    tt = ticket_types[(i + j) % len(ticket_types)]
                    is_single = tt.type == "single"
                    
                    Ticket.objects.create(
                        user=user,
                        ticket_type=tt,
                        from_station=stations[0] if is_single else None,
                        to_station=stations[5] if is_single else None,
                        status="active" if j == 0 else "used",
                        price_paid=tt.price * Decimal("0.7") if i % 2 == 0 else tt.price,
                        valid_from=timezone.now() - timezone.timedelta(days=j),
                        valid_until=timezone.now() + timezone.timedelta(days=tt.duration_days or 1)
                    )

        # 4. Feedbacks
        for i, user in enumerate(users):
            Feedback.objects.create(
                user=user,
                type="experience",
                content=f"Dịch vụ rất tốt, tôi sẽ tiếp tục ủng hộ Metro!",
                status="resolved",
                rating=5
            )

        # 5. ADMIN ACCOUNT
        admin_email = os.getenv("ADMIN_EMAIL", "admin@metrohcm.vn")
        admin_pass = os.getenv("ADMIN_PASSWORD", "admin123")
        if not User.objects.filter(email=admin_email).exists():
            User.objects.create(
                email=admin_email,
                password_hash=self.hash_password(admin_pass),
                full_name="Metro Admin",
                phone="0900000000",
                is_admin=True,
                is_active=True,
                email_verified=True
            )
            self.stdout.write(self.style.SUCCESS(f"Successfully created admin: {admin_email}"))
