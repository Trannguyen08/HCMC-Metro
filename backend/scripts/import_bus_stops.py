import json
import unicodedata
from pathlib import Path

from apps.metro.models import BusStop, Station


def normalize_text(value: str | None) -> str:
    ascii_text = unicodedata.normalize("NFKD", value or "").encode("ascii", "ignore").decode("ascii")
    return " ".join(ascii_text.lower().strip().split())


def load_payload() -> dict:
    json_path = Path("/app/data/tram_xe_buyt_gan_ga_metro_HCMC.json")
    return json.loads(json_path.read_text(encoding="utf-8"))


def main() -> None:
    payload = load_payload()
    rows = payload.get("tram_xe_buyt_gan_ga_metro", [])
    stations_by_name = {normalize_text(station.name): station for station in Station.objects.all()}

    BusStop.objects.all().delete()

    for item in rows:
        station_name = str(item.get("Ga Metro gần nhất", "")).replace("Ga ", "").strip()
        station = stations_by_name.get(normalize_text(station_name))

        BusStop.objects.create(
            code=f"BUS-{int(item['STT']):03d}",
            name=str(item.get("Tên trạm xe buýt", "")).strip(),
            latitude=item.get("Vĩ độ (Latitude)"),
            longitude=item.get("Kinh độ (Longitude)"),
            address=str(item.get("Địa chỉ", "")).strip() or None,
            routes=[
                route.strip()
                for route in str(item.get("Tuyến xe buýt kết nối", "")).split(",")
                if route.strip()
            ],
            station=station,
            distance_to_station=item.get("Khoảng cách tới ga (m)"),
            stop_type=str(item.get("Loại trạm", "")).strip() or None,
            note=str(item.get("Ghi chú", "")).strip() or None,
            is_active=True,
        )

    print(f"Imported {BusStop.objects.count()} bus stops")
    print(f"Linked {BusStop.objects.exclude(station__isnull=True).count()} bus stops to stations")


main()
