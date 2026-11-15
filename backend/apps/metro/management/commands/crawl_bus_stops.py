import json
import logging
import unicodedata
from pathlib import Path

import requests
from django.conf import settings
from django.core.management.base import BaseCommand
from geopy.distance import geodesic

from apps.metro.models import BusStop, Station

logger = logging.getLogger(__name__)

# Accurate HCMC bus route metadata (operating hours, headways, fares, corridors)
FEEDER_ROUTES = {
    "153": "Bến Thủy Bình An ↔ Đường Liên Phường (Thảo Điền / An Phú)",
    "154": "KDC Thạnh Mỹ Lợi ↔ Masteri An Phú (Ga An Phú)",
    "155": "Bến xe buýt Sài Gòn ↔ Nhà hát TP ↔ Ga Ba Son",
    "156": "Bến xe buýt Sài Gòn ↔ Ga Bến Thành ↔ Ga Tân Cảng",
    "157": "Ga Văn Thánh ↔ Chung cư Đức Khải (Bình Thạnh)",
    "158": "Ga Văn Thánh ↔ Cư xá Thanh Đa (Bình Thạnh)",
    "159": "Chung cư Ngô Tất Tố ↔ Ngã tư Hàng Xanh ↔ Ga Văn Thánh",
    "160": "Ga Văn Thánh ↔ Vinhomes Central Park",
    "161": "Ga Văn Thánh ↔ Bến xe Ngã tư Ga",
    "162": "Chung cư Man Thiện ↔ Trường THCS Hoa Lư (Ga Thủ Đức)",
    "163": "Cao đẳng Công Thương ↔ Trường THCS Phước Bình (Ga Bình Thái)",
    "164": "Đại học Nông Lâm ↔ Chung cư Topaz (Ga Khu Công Nghệ Cao)",
    "165": "ĐH Nông Lâm ↔ Khu Công Nghệ Cao ↔ Ga Suối Tiên",
    "166": "ĐHQG TP.HCM ↔ Suối Tiên ↔ Ga ĐHQG",
    "167": "ĐH Nông Lâm ↔ KCX Linh Trung 1 ↔ Ga Khu Công Nghệ Cao",
    "168": "ĐH Sư phạm Kỹ thuật ↔ Ngã tư Bình Thái ↔ Ga Thủ Đức",
    "169": "Vincom Thủ Đức ↔ Ngã tư Tây Hòa ↔ Ga Thủ Đức",
    "D4": "Vinhomes Grand Park ↔ Bến xe buýt Sài Gòn (VinBus điện)",
}

KEY_STANDARD_ROUTES = {
    "1": ("Bến Thành ↔ Bến xe Chợ Lớn", 5000, 10, 15, 5, 21),
    "3": ("Bến Thành ↔ Thạnh Lộc", 6000, 10, 15, 5, 21),
    "4": ("Bến Thành ↔ Cộng Hòa ↔ Bến xe An Sương", 6000, 10, 15, 5, 21),
    "6": ("Bến xe Chợ Lớn ↔ Đại học Nông Lâm", 7000, 10, 15, 5, 21),
    "8": ("Bến xe Quận 8 ↔ Đại học Quốc Gia", 7000, 8, 12, 5, 21),
    "10": ("Đại học Quốc Gia ↔ Bến xe Miền Tây", 7000, 10, 15, 5, 21),
    "18": ("Bến Thành ↔ Chợ Hiệp Thành", 6000, 10, 15, 5, 21),
    "19": ("Bến Thành ↔ KCX Linh Trung ↔ Đại học Quốc Gia", 7000, 8, 15, 5, 21),
    "20": ("Bến Thành ↔ Nhà Bè", 6000, 10, 15, 5, 21),
    "30": ("Chợ Tân Hương ↔ Đại học Quốc tế", 7000, 10, 15, 5, 21),
    "31": ("KDC Tân Quy ↔ Bến Thành ↔ KDC Bình Lợi", 6000, 12, 18, 5, 21),
    "36": ("Bến Thành ↔ Thới An", 6000, 10, 15, 5, 21),
    "44": ("Cảng Quận 4 ↔ Bình Quới", 6000, 12, 18, 5, 21),
    "52": ("Bến Thành ↔ Đại học Quốc tế", 7000, 10, 15, 5, 21),
    "53": ("Lê Hồng Phong ↔ Đại học Quốc Gia", 7000, 8, 15, 5, 21),
    "55": ("Công viên Phần mềm Quang Trung ↔ Bến xe Miền Đông mới", 7000, 10, 15, 5, 21),
    "56": ("Bến xe Chợ Lớn ↔ Đại học Giao thông Vận tải", 7000, 10, 15, 5, 21),
    "65": ("Bến Thành ↔ Cách Mạng Tháng 8 ↔ Bến xe An Sương", 6000, 10, 15, 5, 21),
    "88": ("Bến Thành ↔ Chợ Long Phước", 7000, 12, 18, 5, 21),
    "93": ("Bến Thành ↔ Bến xe Miền Đông mới", 7000, 10, 15, 5, 21),
    "104": ("Bến xe An Sương ↔ Đại học Nông Lâm", 7000, 8, 15, 5, 21),
    "109": ("Bến xe buýt Sài Gòn ↔ Sân bay Tân Sơn Nhất", 15000, 15, 20, 5, 22),
    "150": ("Bến xe Chợ Lớn ↔ Ngã 3 Tân Vạn", 7000, 8, 12, 5, 21),
    "DL01": ("City Tour 2 tầng (Trung tâm Q.1)", 150000, 30, 30, 8, 22),
    "DL02": ("City Tour 2 tầng (Q.1 ↔ Chợ Lớn)", 150000, 30, 30, 8, 22),
}


def normalize_text(value: str | None) -> str:
    ascii_text = unicodedata.normalize("NFKD", value or "").encode("ascii", "ignore").decode("ascii")
    return " ".join(ascii_text.lower().strip().split())


def build_route_schedule(route_code: str) -> dict:
    code = route_code.strip().upper()
    if code in FEEDER_ROUTES:
        return {
            "route": route_code.strip(),
            "route_name": FEEDER_ROUTES[code],
            "is_electric_feeder": True,
            "operating_hours": "05:00 - 22:00 (T6-CN đến 23:00)",
            "start_hour": 5,
            "start_minute": 0,
            "end_hour": 22,
            "end_minute": 0,
            "weekend_end_hour": 23,
            "peak_headway_min": 8,
            "offpeak_headway_min": 15,
            "fare_vnd": 5000,
        }
    if code in KEY_STANDARD_ROUTES:
        name, fare, peak_hw, offpeak_hw, start_h, end_h = KEY_STANDARD_ROUTES[code]
        return {
            "route": route_code.strip(),
            "route_name": name,
            "is_electric_feeder": False,
            "operating_hours": f"{start_h:02d}:00 - {end_h:02d}:00",
            "start_hour": start_h,
            "start_minute": 0,
            "end_hour": end_h,
            "end_minute": 0,
            "weekend_end_hour": end_h,
            "peak_headway_min": peak_hw,
            "offpeak_headway_min": offpeak_hw,
            "fare_vnd": fare,
        }
    return {
        "route": route_code.strip(),
        "route_name": f"Tuyến xe buýt {route_code.strip()}",
        "is_electric_feeder": False,
        "operating_hours": "05:00 - 21:00",
        "start_hour": 5,
        "start_minute": 0,
        "end_hour": 21,
        "end_minute": 0,
        "weekend_end_hour": 21,
        "peak_headway_min": 12,
        "offpeak_headway_min": 18,
        "fare_vnd": 6000,
    }


def fetch_osm_bus_stops_near_station(station: Station) -> list[dict]:
    """Query OpenStreetMap Overpass API for real bus stops within 350m of a Metro station."""
    if not station.latitude or not station.longitude:
        return []
    query = (
        f"[out:json][timeout:10];"
        f"node(around:350,{float(station.latitude)},{float(station.longitude)})[highway=bus_stop];"
        f"out body;"
    )
    endpoints = [
        "https://overpass-api.de/api/interpreter",
        "https://overpass.kumi.systems/api/interpreter",
    ]
    for url in endpoints:
        try:
            resp = requests.post(url, data={"data": query}, timeout=12)
            if resp.status_code == 200 and resp.text.strip().startswith("{"):
                return resp.json().get("elements", [])
        except Exception as exc:
            logger.debug("Overpass endpoint %s failed for station %s: %s", url, station.code, exc)
    return []


class Command(BaseCommand):
    help = "Import and enrich HCMC Metro-connected bus stops with accurate route schedules, optionally crawling OSM."

    def add_arguments(self, parser):
        parser.add_argument(
            "--crawl-osm",
            action="store_true",
            help="Also crawl OpenStreetMap Overpass API for additional bus stops within 350m of stations.",
        )

    def handle(self, *args, **options):
        data_file = Path(settings.BASE_DIR) / "data" / "tram_xe_buyt_gan_ga_metro_HCMC.json"
        if not data_file.exists():
            data_file = Path("/app/data/tram_xe_buyt_gan_ga_metro_HCMC.json")

        payload = json.loads(data_file.read_text(encoding="utf-8"))
        rows = payload.get("tram_xe_buyt_gan_ga_metro", [])

        stations = list(Station.objects.filter(is_active=True))
        stations_by_code = {s.code: s for s in stations if s.code}
        stations_by_name = {normalize_text(s.name): s for s in stations}

        imported_count = 0
        existing_coords: list[tuple[float, float]] = []

        for item in rows:
            code = f"BUS-{int(item['STT']):03d}"
            station_code = str(item.get("Mã ga", "")).strip()
            station_name = str(item.get("Ga Metro gần nhất", "")).replace("Ga ", "").strip()
            station = stations_by_code.get(station_code) or stations_by_name.get(normalize_text(station_name))

            routes = [
                r.strip()
                for r in str(item.get("Tuyến xe buýt kết nối", "")).split(",")
                if r.strip()
            ]
            schedules = [build_route_schedule(r) for r in routes]

            lat = float(item.get("Vĩ độ (Latitude)"))
            lon = float(item.get("Kinh độ (Longitude)"))
            existing_coords.append((lat, lon))

            BusStop.objects.update_or_create(
                code=code,
                defaults={
                    "name": str(item.get("Tên trạm xe buýt", "")).strip(),
                    "latitude": lat,
                    "longitude": lon,
                    "address": str(item.get("Địa chỉ", "")).strip() or None,
                    "routes": routes,
                    "schedules": schedules,
                    "station": station,
                    "distance_to_station": item.get("Khoảng cách tới ga (m)"),
                    "stop_type": str(item.get("Loại trạm", "")).strip() or None,
                    "note": str(item.get("Ghi chú", "")).strip() or None,
                    "is_active": True,
                },
            )
            imported_count += 1

        osm_added = 0
        if options.get("crawl_osm"):
            self.stdout.write("Crawling OpenStreetMap Overpass API for additional nearby bus stops...")
            for station in stations:
                elements = fetch_osm_bus_stops_near_station(station)
                for el in elements:
                    lat = el.get("lat")
                    lon = el.get("lon")
                    tags = el.get("tags", {})
                    name = tags.get("name")
                    if not lat or not lon or not name:
                        continue
                    # Skip if within 45m of an already imported bus stop
                    if any(geodesic((lat, lon), coord).meters < 45 for coord in existing_coords):
                        continue
                    route_ref = tags.get("route_ref") or ""
                    routes = [r.strip() for r in route_ref.replace(";", ",").split(",") if r.strip()]
                    schedules = [build_route_schedule(r) for r in routes] if routes else []
                    dist_m = int(geodesic((lat, lon), (float(station.latitude), float(station.longitude))).meters)
                    osm_code = f"OSM-{el.get('id')}"
                    BusStop.objects.update_or_create(
                        code=osm_code,
                        defaults={
                            "name": name,
                            "latitude": lat,
                            "longitude": lon,
                            "address": tags.get("addr:street") or f"Gần {station.name}",
                            "routes": routes,
                            "schedules": schedules,
                            "station": station,
                            "distance_to_station": dist_m,
                            "stop_type": "Trạm dừng xe buýt (OSM)",
                            "note": "Thu thập bổ sung từ OpenStreetMap",
                            "is_active": True,
                        },
                    )
                    existing_coords.append((lat, lon))
                    osm_added += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Done! Upserted {imported_count} curated bus stops + {osm_added} OSM stops with schedules."
            )
        )
