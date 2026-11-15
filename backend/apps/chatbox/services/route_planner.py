"""
Multi-modal Route Recommendation Engine for HCMC Metro Chatbox.
Resolves HCMC origin/destination coordinates, finds nearest Metro stations,
and computes 2 budget options for the last-mile leg:
  Option 1: Ride-hailing bike (Xe ôm công nghệ)
  Option 2: Connecting Bus (from DB bus_stops + schedules) + optional short ride-hailing
"""
from __future__ import annotations

import json
import logging
import re
import unicodedata
from typing import Any, Optional

import requests
from django.conf import settings
from django.core.cache import cache
from geopy.distance import geodesic

from apps.metro.models import BusStop, Station
from apps.ticketing.models import TicketType
from apps.ticketing.services.booking_service import BookingService

logger = logging.getLogger(__name__)

# Road-distance multiplier over straight-line geodesic distance in HCMC urban grid
ROAD_FACTOR = 1.25

# Curated accurate HCMC landmarks, universities & hubs for instant zero-latency geocoding
HCMC_LANDMARKS: dict[str, tuple[float, float, str]] = {
    # Trung tâm Quận 1 & Metro Line 1 core
    "ben thanh": (10.7721, 106.6983, "Chợ Bến Thành, Quận 1"),
    "cho ben thanh": (10.7721, 106.6983, "Chợ Bến Thành, Quận 1"),
    "pho di bo nguyen hue": (10.7743, 106.7036, "Phố đi bộ Nguyễn Huệ, Quận 1"),
    "nguyen hue": (10.7743, 106.7036, "Phố đi bộ Nguyễn Huệ, Quận 1"),
    "nha tho duc ba": (10.7798, 106.6990, "Nhà thờ Đức Bà, Quận 1"),
    "buu dien thanh pho": (10.7800, 106.6999, "Bưu điện Trung tâm TP.HCM, Quận 1"),
    "dinh doc lap": (10.7769, 106.6954, "Dinh Độc Lập, Quận 1"),
    "bitexco": (10.7717, 106.7044, "Tòa nhà Bitexco, Quận 1"),
    "bui vien": (10.7674, 106.6939, "Phố Tây Bùi Viện, Quận 1"),
    "diamond plaza": (10.7805, 106.6986, "Diamond Plaza, Quận 1"),
    "takashimaya": (10.7731, 106.7010, "Takashimaya / Saigon Centre, Quận 1"),
    "saigon centre": (10.7731, 106.7010, "Saigon Centre, Quận 1"),
    "vincom dong khoi": (10.7782, 106.7019, "Vincom Center Đồng Khởi, Quận 1"),
    "nha hat thanh pho": (10.7766, 106.7031, "Nhà hát Thành phố, Quận 1"),
    "thao cam vien": (10.7875, 106.7053, "Thảo Cầm Viên Sài Gòn, Quận 1"),
    "ba son": (10.7809, 106.7077, "Khu đô thị Ba Son / Cầu Ba Son, Quận 1"),
    "ben bach dang": (10.7746, 106.7068, "Công viên Bến Bạch Đằng, Quận 1"),
    # Bình Thạnh & Thủ Đức dọc tuyến Metro
    "landmark 81": (10.7950, 106.7218, "Landmark 81, Vinhomes Central Park, Bình Thạnh"),
    "vinhomes central park": (10.7950, 106.7218, "Vinhomes Central Park, Bình Thạnh"),
    "hang xanh": (10.8012, 106.7115, "Ngã tư Hàng Xanh, Bình Thạnh"),
    "nga tu hang xanh": (10.8012, 106.7115, "Ngã tư Hàng Xanh, Bình Thạnh"),
    "thao dien": (10.8045, 106.7327, "Thảo Điền, TP. Thủ Đức"),
    "vincom thao dien": (10.8022, 106.7408, "Vincom Mega Mall Thảo Điền, TP. Thủ Đức"),
    "estella": (10.8024, 106.7478, "Estella Place, An Phú, TP. Thủ Đức"),
    "estella place": (10.8024, 106.7478, "Estella Place, An Phú, TP. Thủ Đức"),
    "cantavil": (10.8007, 106.7484, "Cantavil An Phú, TP. Thủ Đức"),
    "mega market an phu": (10.7995, 106.7460, "MM Mega Market An Phú, TP. Thủ Đức"),
    "vincom thu duc": (10.8501, 106.7651, "Vincom Plaza Thủ Đức, Võ Văn Ngân"),
    "gigamall": (10.8278, 106.7214, "TTTM Gigamall Phạm Văn Đồng, Thủ Đức"),
    "nga tu thu duc": (10.8495, 106.7720, "Ngã tư Thủ Đức, TP. Thủ Đức"),
    "suoi tien": (10.8660, 106.8028, "Khu du lịch Suối Tiên, TP. Thủ Đức"),
    "khu du lich suoi tien": (10.8660, 106.8028, "Khu du lịch Suối Tiên, TP. Thủ Đức"),
    "ben xe mien dong moi": (10.8794, 106.8143, "Bến xe Miền Đông mới, TP. Thủ Đức"),
    "ben xe mien dong": (10.8147, 106.7109, "Bến xe Miền Đông cũ, Bình Thạnh"),
    "ben xe mien tay": (10.7412, 106.6194, "Bến xe Miền Tây, Bình Tân"),
    "san bay tan son nhat": (10.8185, 106.6588, "Sân bay Quốc tế Tân Sơn Nhất, Tân Bình"),
    "tan son nhat": (10.8185, 106.6588, "Sân bay Quốc tế Tân Sơn Nhất, Tân Bình"),
    "khu cong nghe cao": (10.8555, 106.7855, "Khu Công Nghệ Cao TP.HCM (KCNC), TP. Thủ Đức"),
    "kcnc": (10.8555, 106.7855, "Khu Công Nghệ Cao TP.HCM (KCNC), TP. Thủ Đức"),
    "cong nghe cao": (10.8555, 106.7855, "Khu Công Nghệ Cao TP.HCM (KCNC), TP. Thủ Đức"),
    "vinhomes grand park": (10.8427, 106.8350, "Vinhomes Grand Park, TP. Thủ Đức"),
    # Các trường Đại học, Cao đẳng nổi bật tại TP.HCM
    "utc2": (10.8442, 106.7825, "Phân hiệu ĐH Giao thông Vận tải TP.HCM (UTC2), 450 Lê Văn Việt, Thủ Đức"),
    "giao thong van tai": (10.8442, 106.7825, "Phân hiệu ĐH Giao thông Vận tải TP.HCM (UTC2), 450 Lê Văn Việt, Thủ Đức"),
    "dai hoc giao thong van tai": (10.8442, 106.7825, "Phân hiệu ĐH Giao thông Vận tải TP.HCM (UTC2), 450 Lê Văn Việt, Thủ Đức"),
    "dh giao thong van tai": (10.8442, 106.7825, "Phân hiệu ĐH Giao thông Vận tải TP.HCM (UTC2), 450 Lê Văn Việt, Thủ Đức"),
    "ut": (10.8035, 106.7166, "ĐH Giao thông Vận tải TP.HCM (UTH - Bình Thạnh), D3/Võ Oanh"),
    "uth": (10.8035, 106.7166, "ĐH Giao thông Vận tải TP.HCM (UTH), Võ Oanh, Bình Thạnh"),
    "dai hoc su pham ky thuat": (10.8507, 106.7719, "ĐH Sư phạm Kỹ thuật TP.HCM (HCMUTE), 01 Võ Văn Ngân, Thủ Đức"),
    "su pham ky thuat": (10.8507, 106.7719, "ĐH Sư phạm Kỹ thuật TP.HCM (HCMUTE), 01 Võ Văn Ngân, Thủ Đức"),
    "hcmute": (10.8507, 106.7719, "ĐH Sư phạm Kỹ thuật TP.HCM (HCMUTE), 01 Võ Văn Ngân, Thủ Đức"),
    "spkt": (10.8507, 106.7719, "ĐH Sư phạm Kỹ thuật TP.HCM (HCMUTE), 01 Võ Văn Ngân, Thủ Đức"),
    "dai hoc nong lam": (10.8713, 106.7918, "ĐH Nông Lâm TP.HCM, Thủ Đức"),
    "nong lam": (10.8713, 106.7918, "ĐH Nông Lâm TP.HCM, Thủ Đức"),
    "dai hoc quoc gia": (10.8700, 106.8031, "Làng Đại học Quốc gia TP.HCM, TP. Thủ Đức"),
    "lang dai hoc": (10.8700, 106.8031, "Làng Đại học Quốc gia TP.HCM, TP. Thủ Đức"),
    "dhqg": (10.8700, 106.8031, "Làng Đại học Quốc gia TP.HCM, TP. Thủ Đức"),
    "uit": (10.8700, 106.8030, "ĐH Công nghệ Thông tin (UIT - ĐHQG), TP. Thủ Đức"),
    "cong nghe thong tin": (10.8700, 106.8030, "ĐH Công nghệ Thông tin (UIT - ĐHQG), TP. Thủ Đức"),
    "khtn": (10.7629, 106.6822, "ĐH Khoa học Tự nhiên TP.HCM (227 Nguyễn Văn Cừ, Q.5)"),
    "khoa hoc tu nhien": (10.7629, 106.6822, "ĐH Khoa học Tự nhiên TP.HCM (227 Nguyễn Văn Cừ, Q.5)"),
    "khxhnv": (10.7857, 106.7024, "ĐH KHXH&NV TP.HCM (10-12 Đinh Tiên Hoàng, Q.1)"),
    "nhan van": (10.7857, 106.7024, "ĐH KHXH&NV TP.HCM (10-12 Đinh Tiên Hoàng, Q.1)"),
    "uel": (10.8706, 106.7782, "ĐH Kinh tế - Luật (UEL), Quốc lộ 1A, Linh Xuân, Thủ Đức"),
    "kinh te luat": (10.8706, 106.7782, "ĐH Kinh tế - Luật (UEL), Linh Xuân, Thủ Đức"),
    "dai hoc quoc te": (10.8778, 106.8016, "ĐH Quốc tế (IU - ĐHQG), TP. Thủ Đức"),
    "hutech": (10.8019, 106.7145, "ĐH Công nghệ TP.HCM (HUTECH - Điện Biên Phủ), Bình Thạnh"),
    "hutech khu e": (10.8550, 106.7853, "ĐH HUTECH Khu E (Khu Công nghệ cao), Thủ Đức"),
    "fpt": (10.8411, 106.8099, "ĐH FPT TP.HCM (Khu Công nghệ cao), TP. Thủ Đức"),
    "dai hoc fpt": (10.8411, 106.8099, "ĐH FPT TP.HCM (Khu Công nghệ cao), TP. Thủ Đức"),
    "uef": (10.7972, 106.7037, "ĐH Kinh tế Tài chính (UEF), Điện Biên Phủ, Bình Thạnh"),
    "dai hoc bach khoa": (10.7721, 106.6579, "ĐH Bách Khoa TP.HCM, 268 Lý Thường Kiệt, Quận 10"),
    "dh bach khoa": (10.7721, 106.6579, "ĐH Bách Khoa TP.HCM, 268 Lý Thường Kiệt, Quận 10"),
    "bach khoa": (10.7721, 106.6579, "ĐH Bách Khoa TP.HCM, 268 Lý Thường Kiệt, Quận 10"),
    "ueh": (10.7834, 106.6952, "ĐH Kinh tế TP.HCM (UEH), 59C Nguyễn Đình Chiểu, Q.3"),
    "kinh te tp hcm": (10.7834, 106.6952, "ĐH Kinh tế TP.HCM (UEH), Quận 3"),
    "ton duc thang": (10.7327, 106.6996, "ĐH Tôn Đức Thắng (TDTU), Nguyễn Hữu Thọ, Quận 7"),
    "tdtu": (10.7327, 106.6996, "ĐH Tôn Đức Thắng (TDTU), Nguyễn Hữu Thọ, Quận 7"),
    "rmit": (10.7294, 106.6939, "ĐH RMIT Việt Nam, Nguyễn Văn Linh, Quận 7"),
    "van lang": (10.8275, 106.6998, "ĐH Văn Lang (Cơ sở 3), Phan Văn Trị / Đặng Thùy Trâm, Bình Thạnh"),
    "cong nghiep": (10.8221, 106.6874, "ĐH Công nghiệp TP.HCM (IUH), Nguyễn Văn Bảo, Gò Vấp"),
    "iuh": (10.8221, 106.6874, "ĐH Công nghiệp TP.HCM (IUH), Gò Vấp"),
    "ngoai thuong": (10.8065, 106.7145, "ĐH Ngoại thương CS2 (FTU2), D5 Bình Thạnh"),
    "ftu2": (10.8065, 106.7145, "ĐH Ngoại thương CS2 (FTU2), D5 Bình Thạnh"),
    "luat tp hcm": (10.7646, 106.7063, "ĐH Luật TP.HCM, Nguyễn Tất Thành, Quận 4"),
    "ngan hang": (10.8588, 106.7623, "ĐH Ngân hàng TP.HCM (HUB), Hoàng Diệu 2, Thủ Đức"),
    "tai chinh marketing": (10.8406, 106.7847, "ĐH Tài chính - Marketing (UFM), Tăng Nhơn Phú A, Thủ Đức"),
    "ufm": (10.8406, 106.7847, "ĐH Tài chính - Marketing (UFM), Tăng Nhơn Phú A, Thủ Đức"),
    "hong bang": (10.8005, 106.7058, "ĐH Quốc tế Hồng Bàng (HIU), Điện Biên Phủ, Bình Thạnh"),
    "cong thuong": (10.8066, 106.6288, "ĐH Công Thương TP.HCM (HUIT), Lê Trọng Tấn, Tân Phú"),
    "sai gon": (10.7599, 106.6822, "ĐH Sài Gòn (SGU), 273 An Dương Vương, Quận 5"),
    "su pham tp hcm": (10.7614, 106.6822, "ĐH Sư phạm TP.HCM (HCMUE), 280 An Dương Vương, Quận 5"),
    "y duoc": (10.7556, 106.6644, "ĐH Y Dược TP.HCM, 217 Hồng Bàng, Quận 5"),
    # Bệnh viện, TTTM, khu vui chơi & địa danh nổi bật
    "benh vien ung buou 2": (10.8698, 106.8095, "Bệnh viện Ung bướu TP.HCM Cơ sở 2, Thủ Đức"),
    "ung buou 2": (10.8698, 106.8095, "Bệnh viện Ung bướu TP.HCM Cơ sở 2, Thủ Đức"),
    "benh vien cho ray": (10.7575, 106.6596, "Bệnh viện Chợ Rẫy, Quận 5"),
    "cho ray": (10.7575, 106.6596, "Bệnh viện Chợ Rẫy, Quận 5"),
    "quan y 175": (10.8226, 106.6786, "Bệnh viện Quân y 175, Gò Vấp"),
    "vinmec": (10.7938, 106.7204, "Bệnh viện ĐKQT Vinmec Central Park, Bình Thạnh"),
    "phu my hung": (10.7295, 106.7219, "Phú Mỹ Hưng / Crescent Mall, Quận 7"),
    "crescent mall": (10.7289, 106.7191, "Crescent Mall, Quận 7"),
    "sc vivocity": (10.7299, 106.7037, "SC VivoCity, Quận 7"),
    "aeon mall tan phu": (10.8016, 106.6177, "AEON Mall Tân Phú"),
    "aeon mall binh tan": (10.7429, 106.6122, "AEON Mall Bình Tân"),
    "emart go vap": (10.8228, 106.6934, "Emart Phan Văn Trị, Gò Vấp"),
    "emart sala": (10.7717, 106.7235, "Emart Sala Thủ Thiêm, TP. Thủ Đức"),
    "khu do thi sala": (10.7717, 106.7235, "Khu đô thị Sala Thủ Thiêm, TP. Thủ Đức"),
    "dam sen": (10.7684, 106.6366, "Công viên Văn hóa Đầm Sen, Quận 11"),
    "cho lon": (10.7495, 106.6508, "Chợ Lớn / Bình Tây, Quận 5-6"),
    "quan 1": (10.7757, 106.7004, "Trung tâm Quận 1"),
    "quan 2": (10.7872, 106.7498, "Khu vực Quận 2 / Thảo Điền - An Phú"),
    "quan 3": (10.7844, 106.6844, "Trung tâm Quận 3"),
    "quan 4": (10.7578, 106.7013, "Trung tâm Quận 4"),
    "quan 5": (10.7540, 106.6634, "Trung tâm Quận 5"),
    "quan 7": (10.7340, 106.7218, "Trung tâm Quận 7"),
    "quan 9": (10.8428, 106.8287, "Khu vực Quận 9 / TP. Thủ Đức"),
    "quan 10": (10.7725, 106.6675, "Trung tâm Quận 10"),
    "binh thanh": (10.8106, 106.7091, "Quận Bình Thạnh"),
    "phu nhuan": (10.7992, 106.6803, "Quận Phú Nhuận"),
    "go vap": (10.8387, 106.6653, "Quận Gò Vấp"),
    "tan binh": (10.8015, 106.6526, "Quận Tân Bình"),
    "thu duc": (10.8494, 106.7537, "Trung tâm TP. Thủ Đức"),
}

ROUTE_KEYWORDS = (
    "đi từ", "di tu", "từ ", "tu ", "đến ", "den ", "tới ", "toi ",
    "lộ trình", "lo trinh", "đường đi", "duong di", "bắt xe", "bat xe",
    "xe ôm", "xe om", "grab", "xe buýt", "xe buyt", "bus", "gần ga",
    "gan ga", "cách đi", "cach di", "ngân sách", "ngan sach", "tiết kiệm",
)


def _norm(text: str) -> str:
    ascii_text = unicodedata.normalize("NFKD", text or "").encode("ascii", "ignore").decode("ascii")
    return " ".join(re.sub(r"[^a-z0-9\s]", " ", ascii_text.lower()).split())


def looks_like_route_query(message: str) -> bool:
    normed = _norm(message)
    return any(_norm(kw) in normed for kw in ROUTE_KEYWORDS)


def _regex_extract_route(message: str) -> Optional[dict[str, Any]]:
    """Fast zero-latency regex extraction for common Vietnamese 'từ X đến/tới Y' queries."""
    patterns = (
        re.compile(
            r"(?:đi\s+)?từ\s+(.+?)\s+(?:đến|tới|qua|sang|về|->|→)\s+(.+?)(?:[?!,]|$|\.(?:\s|$))",
            re.IGNORECASE | re.UNICODE,
        ),
        re.compile(
            r"^(.+?)\s+(?:đến|tới|->|→)\s+(.+?)(?:[?!,]|$|\.(?:\s|$))",
            re.IGNORECASE | re.UNICODE,
        ),
    )
    match = None
    for pat in patterns:
        match = pat.search(message.strip())
        if match:
            break
    if not match:
        return None
    origin = match.group(1).strip(" ,.-\"'")
    # Clean conversational prefixes from origin when matched without "từ"
    origin = re.sub(
        r"^(?:cho\s+(?:mình|tôi|em)\s+hỏi\s+|hướng\s+dẫn\s+(?:đi\s+)?|cách\s+đi\s+|lộ\s+trình\s+|muốn\s+đi\s+)+",
        "",
        origin,
        flags=re.IGNORECASE,
    ).strip(" ,.-\"'")
    dest = match.group(2).strip(" ,.-\"'")
    # Strip trailing budget/question words from destination
    dest = re.sub(
        r"\s+(?:thì\s+đi\s+như\s+thế\s+nào|bằng\s+gì|hết\s+bao\s+nhiêu|như\s+thế\s+nào|sao\s+cho\s+rẻ|tiết\s+kiệm).*$",
        "",
        dest,
        flags=re.IGNORECASE,
    ).strip()
    if not origin or not dest or len(origin) < 2 or len(dest) < 2:
        return None
    vague_tokens = ("nhà mình", "nha minh", "nhà tôi", "nha toi", "chỗ làm", "cho lam", "đây", "day", "đó", "kia", "đâu đó")
    is_vague = any(vt in origin.lower() or vt in dest.lower() for vt in vague_tokens)
    is_student = any(k in message.lower() for k in ("sinh viên", "học sinh", "hssv", "student"))
    return {
        "is_route_query": True,
        "origin": origin,
        "destination": dest,
        "is_student": is_student,
        "is_vague": is_vague,
        "missing_info": "địa chỉ cụ thể hơn tại TP.HCM" if is_vague else "",
    }


def extract_route_intent(message: str, history: list[dict]) -> dict[str, Any]:
    """
    Extracts origin, destination, and clarity from natural Vietnamese queries.
    Uses fast regex first, then Groq LLM, with graceful fallback.
    """
    regex_hit = _regex_extract_route(message)
    if regex_hit:
        return regex_hit

    api_key = getattr(settings, "GROQ_API_KEY", "")
    model = getattr(settings, "GROQ_MODEL", "llama-3.3-70b-versatile")
    if not api_key:
        return {"is_route_query": True, "is_vague": True, "missing_info": "điểm đi và điểm đến cụ thể"}

    recent_context = "\n".join(
        f"{m['role']}: {m['content']}" for m in history[-4:]
    )
    prompt = f"""Phân tích tin nhắn của người dùng để trích xuất ý định tìm đường đi Metro TP.HCM.
Lịch sử gần đây:
{recent_context}

Tin nhắn hiện tại: "{message}"

Chỉ trả về JSON hợp lệ với các trường:
- "is_route_query": boolean
- "origin": string hoặc null
- "destination": string hoặc null
- "is_student": boolean
- "is_vague": boolean (true nếu địa điểm đi hoặc đến mơ hồ như "nhà tôi", "gần đây" hoặc thiếu 1 trong 2 điểm; false nếu là tên địa danh, trường học, trung tâm thương mại, khu công nghệ, quận/huyện cụ thể)
- "missing_info": string
"""
    try:
        resp = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.1,
                "max_tokens": 250,
            },
            timeout=10,
        )
        if resp.status_code == 200:
            content = resp.json()["choices"][0]["message"]["content"].strip()
            content = re.sub(r"^```(?:json)?\s*|\s*```$", "", content, flags=re.MULTILINE).strip()
            return json.loads(content)
        logger.warning("[RoutePlanner] Groq intent status %s: %s", resp.status_code, resp.text[:200])
    except Exception as exc:
        logger.warning("[RoutePlanner] Intent extraction failed: %s", exc)

    return {"is_route_query": True, "is_vague": True, "missing_info": "điểm xuất phát và điểm đến cụ thể tại TP.HCM"}


_STOP_TOKENS = {
    "truong", "dai", "hoc", "dh", "cao", "dang", "cd", "phan", "hieu",
    "khu", "trung", "tam", "toa", "nha", "duong", "phuong", "quan",
    "tp", "hcm", "tphcm", "thanh", "pho", "ho", "chi", "minh", "viet", "nam",
    "co", "so", "cs", "cong", "vien", "benh", "cho", "ga",
}


def geocode_hcmc(place: str) -> Optional[dict[str, Any]]:
    """
    Resolves a place name/address in HCMC to {lat, lon, display_name}.
    Checks local curated landmarks (word-boundary + acronym + token overlap) -> DB stations -> Nominatim OSM.
    """
    if not place:
        return None
    normed = _norm(place)
    if not normed or len(normed) < 2:
        return None

    # Also build candidate strings (full, without parenthetical, and parenthetical content)
    candidates = [normed]
    paren_matches = re.findall(r"\(([^)]+)\)", place)
    for pm in paren_matches:
        pm_norm = _norm(pm)
        if pm_norm and pm_norm not in candidates:
            candidates.append(pm_norm)
    stripped_paren = _norm(re.sub(r"\([^)]*\)", " ", place))
    if stripped_paren and stripped_paren not in candidates:
        candidates.append(stripped_paren)

    sorted_landmarks = sorted(HCMC_LANDMARKS.items(), key=lambda kv: len(kv[0]), reverse=True)

    # 1a. Exact or word-boundary match in curated landmarks (longest key wins)
    for cand in candidates:
        for key, (lat, lon, label) in sorted_landmarks:
            if key == cand or re.search(rf"(?:^|\s){re.escape(key)}(?:\s|$)", cand):
                return {"lat": lat, "lon": lon, "display_name": label}

    # 1b. Token-overlap match against curated landmarks (ignoring generic words)
    query_tokens = {t for t in normed.split() if t not in _STOP_TOKENS and len(t) >= 2}
    if query_tokens:
        best_score = 0.0
        best_match: Optional[tuple[float, float, str]] = None
        for key, val in sorted_landmarks:
            key_tokens = {t for t in key.split() if t not in _STOP_TOKENS and len(t) >= 2}
            if not key_tokens:
                continue
            overlap = len(query_tokens & key_tokens)
            if overlap == len(key_tokens) or (overlap >= 2 and overlap / len(key_tokens) >= 0.75):
                score = overlap + overlap / len(key_tokens)
                if score > best_score:
                    best_score = score
                    best_match = val
        if best_match:
            return {"lat": best_match[0], "lon": best_match[1], "display_name": best_match[2]}

    # 2. Match against Metro stations in DB
    for st in Station.objects.filter(is_active=True):
        st_norm = _norm(st.name)
        if st_norm in normed or normed in st_norm:
            return {
                "lat": float(st.latitude),
                "lon": float(st.longitude),
                "display_name": f"Ga {st.name}",
            }

    # 3. Check Redis cache for Nominatim result
    cache_key = f"geocode:hcmc:{normed}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached if cached != "NOT_FOUND" else None

    # 4. Query OpenStreetMap Nominatim bounded to HCMC
    try:
        resp = requests.get(
            "https://nominatim.openstreetmap.org/search",
            params={
                "q": f"{place}, Thành phố Hồ Chí Minh, Vietnam",
                "format": "json",
                "limit": 1,
                "viewbox": "106.35,11.16,107.03,10.35",
                "bounded": 1,
            },
            headers={"User-Agent": "HCMC-Metro-Route-Planner/1.0"},
            timeout=5,
        )
        if resp.status_code == 200:
            items = resp.json()
            if items:
                result = {
                    "lat": float(items[0]["lat"]),
                    "lon": float(items[0]["lon"]),
                    "display_name": items[0].get("display_name", place),
                }
                cache.set(cache_key, result, 86400)
                return result
    except Exception as exc:
        logger.warning("[RoutePlanner] Nominatim geocode failed for '%s': %s", place, exc)

    cache.set(cache_key, "NOT_FOUND", 3600)
    return None


def estimate_ride_hailing_fare(distance_km: float) -> int:
    """
    Realistic HCMC ride-hailing bike (GrabBike / BeBike / XanhSM Bike) fare:
    - First 2 km: 12.500 VND
    - Each additional km: 4.300 VND
    Rounded to nearest 1.000 VND.
    """
    if distance_km <= 0.15:
        return 0
    if distance_km <= 2.0:
        raw = 12500
    else:
        raw = 12500 + (distance_km - 2.0) * 4300
    return int(round(raw / 1000.0) * 1000)


def _nearest_station(lat: float, lon: float, stations: list[Station]) -> tuple[Station, float]:
    best_st = stations[0]
    best_dist = float("inf")
    for st in stations:
        if not st.latitude or not st.longitude:
            continue
        d = geodesic((lat, lon), (float(st.latitude), float(st.longitude))).kilometers
        if d < best_dist:
            best_dist = d
            best_st = st
    return best_st, round(best_dist * ROAD_FACTOR, 2)


def _find_bus_option(
    arrival_station: Station,
    dest_geo: dict[str, Any],
    all_bus_stops: list[BusStop],
) -> dict[str, Any]:
    """
    Finds the best bus connection from arrival_station toward dest_geo using real BusStop records.
    """
    station_stops = [bs for bs in all_bus_stops if bs.station_id == arrival_station.id]
    if not station_stops:
        # Fallback to closest bus stop within 600m of arrival_station
        station_stops = sorted(
            all_bus_stops,
            key=lambda bs: geodesic(
                (float(arrival_station.latitude), float(arrival_station.longitude)),
                (float(bs.latitude), float(bs.longitude)),
            ).meters,
        )[:2]

    # Find bus stop closest to destination to see if any route overlaps
    dest_lat, dest_lon = dest_geo["lat"], dest_geo["lon"]
    stops_near_dest = sorted(
        all_bus_stops,
        key=lambda bs: geodesic((dest_lat, dest_lon), (float(bs.latitude), float(bs.longitude))).kilometers,
    )
    closest_dest_stop = stops_near_dest[0] if stops_near_dest else None

    board_stop = station_stops[0] if station_stops else None
    board_routes = set(board_stop.routes or []) if board_stop else set()

    # Check if any route from board_stop also serves a stop closer to destination
    matched_stop = None
    shared_routes: list[str] = []
    for candidate in stops_near_dest[:5]:
        cand_routes = set(candidate.routes or [])
        overlap = sorted(board_routes & cand_routes)
        if overlap:
            dist_to_dest = geodesic(
                (dest_lat, dest_lon), (float(candidate.latitude), float(candidate.longitude))
            ).kilometers * ROAD_FACTOR
            dist_station_to_dest = geodesic(
                (float(arrival_station.latitude), float(arrival_station.longitude)),
                (dest_lat, dest_lon),
            ).kilometers * ROAD_FACTOR
            if dist_to_dest < dist_station_to_dest:
                matched_stop = candidate
                shared_routes = overlap
                break

    # Pick schedule details for recommended routes
    recommended_routes = shared_routes[:3] if shared_routes else (list(board_routes)[:3] if board_routes else [])
    schedule_map = {
        s.get("route"): s for s in ((board_stop.schedules or []) if board_stop else [])
    }

    route_details = []
    bus_fare = 6000
    for r in recommended_routes:
        sc = schedule_map.get(r, {})
        fare = int(sc.get("fare_vnd", 5000 if r.startswith("15") or r.startswith("16") or r == "D4" else 6000))
        bus_fare = min(bus_fare, fare) if route_details else fare
        route_details.append(
            {
                "route": r,
                "route_name": sc.get("route_name", f"Tuyến {r}"),
                "operating_hours": sc.get("operating_hours", "05:00 - 22:00"),
                "headway_min": sc.get("peak_headway_min", 10),
                "fare_vnd": fare,
            }
        )

    if matched_stop:
        last_mile_km = round(
            geodesic(
                (dest_lat, dest_lon),
                (float(matched_stop.latitude), float(matched_stop.longitude)),
            ).kilometers
            * ROAD_FACTOR,
            2,
        )
        alighting_stop_name = matched_stop.name
    else:
        # Estimate bus covers ~70% of the distance toward destination corridor, leaving shorter last-mile
        full_km = geodesic(
            (float(arrival_station.latitude), float(arrival_station.longitude)),
            (dest_lat, dest_lon),
        ).kilometers * ROAD_FACTOR
        last_mile_km = round(max(0.4, full_km * 0.3), 2)
        alighting_stop_name = (
            closest_dest_stop.name if closest_dest_stop else f"Trạm buýt gần {dest_geo['display_name']}"
        )

    last_mile_ride_fare = 0 if last_mile_km <= 0.4 else estimate_ride_hailing_fare(last_mile_km)

    return {
        "boarding_stop": board_stop.name if board_stop else f"Trạm buýt tại Ga {arrival_station.name}",
        "alighting_stop": alighting_stop_name,
        "routes": route_details,
        "bus_fare_vnd": bus_fare,
        "last_mile_km": last_mile_km,
        "last_mile_walkable": last_mile_km <= 0.4,
        "last_mile_ride_fare_vnd": last_mile_ride_fare,
        "total_from_station_vnd": bus_fare + last_mile_ride_fare,
    }


def build_route_context_if_applicable(history: list[dict], user_message: str) -> str:
    """
    Detects route-planning intent, geocodes origin & destination, and returns
    a grounded context block for the LLM (or clarification instructions if vague).
    """
    if not looks_like_route_query(user_message) and not any(
        looks_like_route_query(m.get("content", "")) for m in history[-2:]
    ):
        return ""

    intent = extract_route_intent(user_message, history)
    if not intent.get("is_route_query"):
        return ""

    origin_str = intent.get("origin")
    dest_str = intent.get("destination")
    if intent.get("is_vague") or not origin_str or not dest_str:
        missing = intent.get("missing_info") or "điểm xuất phát và điểm đến cụ thể tại TP.HCM"
        return (
            "\n### HƯỚNG DẪN XỬ LÝ YÊU CẦU LỘ TRÌNH (THIẾU DỮ KIỆN):\n"
            f"- Người dùng chưa cung cấp đủ hoặc nhập địa chỉ còn mơ hồ ({missing}).\n"
            "- Hãy lịch sự hỏi thêm người dùng để làm rõ: (1) Địa chỉ/tên đường/địa danh xuất phát cụ thể, "
            "(2) Địa điểm muốn đến cụ thể tại TP.HCM, và (3) Ngân sách hoặc có phải học sinh/sinh viên không để tính đúng giá vé."
        )

    origin_geo = geocode_hcmc(origin_str)
    dest_geo = geocode_hcmc(dest_str)

    if not origin_geo or not dest_geo:
        unclear = []
        if not origin_geo:
            unclear.append(f"điểm đi '{origin_str}'")
        if not dest_geo:
            unclear.append(f"điểm đến '{dest_str}'")
        return (
            "\n### HƯỚNG DẪN XỬ LÝ YÊU CẦU LỘ TRÌNH (KHÔNG ĐỊNH VỊ ĐƯỢC ĐỊA CHỈ):\n"
            f"- Không tìm thấy tọa độ chính xác cho {', '.join(unclear)} tại TP.HCM.\n"
            "- Hãy hỏi lại người dùng cung cấp tên đường, phường/quận hoặc địa danh nổi tiếng gần đó để tư vấn chính xác."
        )

    stations = list(Station.objects.filter(is_active=True).order_by("sequence_order"))
    if not stations:
        return ""

    dep_station, origin_to_dep_km = _nearest_station(origin_geo["lat"], origin_geo["lon"], stations)
    arr_station, arr_to_dest_km = _nearest_station(dest_geo["lat"], dest_geo["lon"], stations)

    # Calculate Metro ticket price
    single_ticket = TicketType.objects.filter(type="single", is_active=True).first()
    if single_ticket:
        price_info = BookingService.calculate_price(single_ticket, dep_station, arr_station)
        metro_fare = int(price_info["total"])
    else:
        metro_fare = 12000
    if intent.get("is_student"):
        metro_fare = int(round((metro_fare * 0.7) / 100.0) * 100)

    station_hops = abs((dep_station.sequence_order or 0) - (arr_station.sequence_order or 0))
    metro_minutes = max(3, station_hops * 2 + 2)

    # First-mile estimate (Origin -> Departure Station)
    first_mile_ride_fare = 0 if origin_to_dep_km <= 0.4 else estimate_ride_hailing_fare(origin_to_dep_km)

    # Last-mile Option 1: Direct Ride-hailing from Arrival Station -> Destination
    opt1_ride_fare = 0 if arr_to_dest_km <= 0.4 else estimate_ride_hailing_fare(arr_to_dest_km)
    opt1_minutes = max(2, int(round(arr_to_dest_km * 3.0)))
    opt1_total = first_mile_ride_fare + metro_fare + opt1_ride_fare

    # Last-mile Option 2: Bus + Ride-hailing
    all_bus_stops = list(BusStop.objects.filter(is_active=True).select_related("station"))
    opt2 = _find_bus_option(arr_station, dest_geo, all_bus_stops)
    opt2_total = first_mile_ride_fare + metro_fare + opt2["total_from_station_vnd"]

    bus_lines_text = "\n".join(
        f"    + Tuyến {r['route']} ({r['route_name']}): Giá {r['fare_vnd']:,}đ | Giờ chạy {r['operating_hours']} | Giãn cách ~{r['headway_min']} phút"
        for r in opt2["routes"]
    ) or "    + Các tuyến buýt kết nối tại trạm gần ga (giá ~5.000đ - 6.000đ)"

    return f"""
### KẾT QUẢ TÍNH TOÁN LỘ TRÌNH THỰC TẾ (BẮT BUỘC DÙNG SỐ LIỆU NÀY, KHÔNG TỰ BỊA):
- **Điểm xuất phát:** {origin_geo['display_name']}
- **Điểm đến:** {dest_geo['display_name']}
- **Chặng 1 (Đến ga Metro):** Ga đi gần nhất là **Ga {dep_station.name}** (cách điểm đi ~{origin_to_dep_km} km; {'có thể đi bộ' if origin_to_dep_km <= 0.4 else f'xe ôm công nghệ khoảng {first_mile_ride_fare:,}đ'}).
- **Chặng 2 (Đi tàu Metro Tuyến số 1):** Từ **Ga {dep_station.name}** → **Ga {arr_station.name}** ({station_hops} trạm, ~{metro_minutes} phút). Giá vé Metro: **{metro_fare:,}đ**{' (đã giảm 30% HSSV)' if intent.get('is_student') else ''}.
- **Chặng 3 (Từ Ga {arr_station.name} đến {dest_geo['display_name']}) — 2 LỰA CHỌN THEO NGÂN SÁCH:**
  - **Option 1 (Nhanh nhất — Xe ôm công nghệ GrabBike/Be/XanhSM):**
    + Khoảng cách từ Ga {arr_station.name} tới điểm đến: **~{arr_to_dest_km} km** (~{opt1_minutes} phút).
    + Giá xe ôm công nghệ ước tính: **~{opt1_ride_fare:,}đ**{' (có thể đi bộ vì rất gần)' if arr_to_dest_km <= 0.4 else ''}.
    + **Tổng chi phí toàn hành trình (Option 1): ~{opt1_total:,}đ**.
  - **Option 2 (Tiết kiệm — Xe buýt + Xe ôm công nghệ chặng cuối):**
    + Đón xe buýt tại trạm: **{opt2['boarding_stop']}**.
{bus_lines_text}
    + Xuống tại: **{opt2['alighting_stop']}**, đi tiếp tới điểm đến (~{opt2['last_mile_km']} km: {'đi bộ 0đ' if opt2['last_mile_walkable'] else f'xe ôm công nghệ ~{opt2["last_mile_ride_fare_vnd"]:,}đ'}).
    + Chi phí chặng 3: **~{opt2['total_from_station_vnd']:,}đ** (Vé buýt {opt2['bus_fare_vnd']:,}đ + chặng cuối {opt2['last_mile_ride_fare_vnd']:,}đ).
    + **Tổng chi phí toàn hành trình (Option 2): ~{opt2_total:,}đ** (Tiết kiệm được **{max(0, opt1_total - opt2_total):,}đ** so với Option 1).
"""
