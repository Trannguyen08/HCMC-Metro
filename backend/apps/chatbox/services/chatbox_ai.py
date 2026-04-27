"""
Service gọi Groq API với streaming.
Dùng thư viện `requests` (đã có trong requirements.txt) để gọi Groq OpenAI-compatible endpoint.
"""
import json
import logging
import re
import time

import requests
from django.conf import settings

from apps.chatbox.config.blocklist import OUTPUT_SENSITIVE_KEYWORDS
from apps.chatbox.config.system_prompt import METRO_SYSTEM_PROMPT
from apps.metro.models import Station, MetroLine

logger = logging.getLogger(__name__)

# Cấu hình AI từ Django settings (configured via .env)
GROQ_API_KEY = settings.GROQ_API_KEY
GROQ_MODEL = settings.GROQ_MODEL
# Tăng giới hạn token để trả lời đầy đủ
MAX_TOKENS = settings.MAX_TOKENS

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

# Số lượng tin nhắn lịch sử đưa vào context
HISTORY_WINDOW = 10


def _build_system_context() -> str:
    """Lấy dữ liệu chi tiết từ DB để AI có đủ thông tin trả lời."""
    lines = []
    try:
        stations = Station.objects.filter(is_active=True).order_by("sequence_order").values(
            "name", "code", "address", "sequence_order"
        )
        metro_lines = MetroLine.objects.filter(is_active=True).values("name", "code", "description")

        lines.append("### THÔNG TIN CÁC TUYẾN METRO:")
        for ml in metro_lines:
            lines.append(f"- {ml['name']} ({ml['code']}): {ml.get('description', '')}")

        lines.append("\n### DANH SÁCH CÁC GA (TUYẾN 1):")
        for st in stations:
            lines.append(f"{st['sequence_order']}. {st['name']} ({st['code']}) — Địa chỉ: {st.get('address', '')}")

        lines.append("\n### THÔNG TIN VÉ CHI TIẾT:")
        lines.append("- Vé lượt: 7.000đ - 15.000đ (tùy theo cự ly di chuyển)")
        lines.append("- Vé ngày: 40.000đ (không giới hạn lượt đi trong ngày)")
        lines.append("- Vé 3 ngày: 90.000đ")
        lines.append("- Vé tháng: 450.000đ (Phổ thông), 225.000đ (Học sinh/Sinh viên)")

        lines.append("\n### KẾT NỐI XE BUÝT TẠI CÁC GA TRỌNG ĐIỂM:")
        lines.append("- Ga Bến Thành: Trạm trung chuyển lớn nhất. Kết nối các tuyến: 01, 02, 03, 04, 18, 19, 20, 31, 34, 36, 38, 39, 44, 45, 52, 53, 56, 65, 88, 93, 102, 109, 152.")
        lines.append("- Ga Ba Son: Kết nối các tuyến: 01, 02, 03, 19, 45, 53, 56, 88.")
        lines.append("- Ga Tân Cảng: Kết nối các tuyến: 06, 30, 53, 56, 104, 150.")
        lines.append("- Ga Thủ Đức: Kết nối các tuyến: 06, 08, 56, 141, 60-1.")

        lines.append("\n### GIỜ HOẠT ĐỘNG:")
        lines.append("- Từ 5:30 sáng đến 22:30 tối hàng ngày.")
        lines.append("- Tần suất: Giờ cao điểm (5-10 phút), giờ bình thường (15 phút).")

    except Exception as e:
        logger.warning(f"[CHATBOX] Lỗi lấy dữ liệu DB: {e}")
        lines.append("(Dữ liệu tạm thời không khả dụng, vui lòng tham khảo website chính thức)")

    return "\n".join(lines)


def build_full_system_prompt() -> str:
    """Tạo system prompt hoàn chỉnh."""
    context = _build_system_context()
    return METRO_SYSTEM_PROMPT.replace("{{SYSTEM_CONTEXT}}", context)


def build_messages(history: list[dict], user_message: str) -> list[dict]:
    """Tạo danh sách message gửi cho AI với đầy đủ lịch sử (không cắt ngắn)."""
    messages = [{"role": "system", "content": build_full_system_prompt()}]

    recent_history = history[-HISTORY_WINDOW:] if len(history) > HISTORY_WINDOW else history
    for msg in recent_history:
        messages.append({"role": msg["role"], "content": msg["content"]})

    messages.append({"role": "user", "content": user_message})
    return messages


def contains_sensitive_output(text: str) -> bool:
    text_lower = text.lower()
    return any(kw in text_lower for kw in OUTPUT_SENSITIVE_KEYWORDS)


def stream_groq_response(messages: list[dict]):
    """Gọi Groq API và stream kết quả."""
    if not GROQ_API_KEY:
        yield {"error": "Dịch vụ AI hiện chưa được cấu hình key."}
        return

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": GROQ_MODEL,
        "messages": messages,
        "max_tokens": MAX_TOKENS,
        "temperature": 0.5, # Giảm nhiệt độ để trả lời chính xác và logic hơn
        "stream": True,
    }

    start_time = time.time()
    full_response = ""
    tokens_used = 0

    try:
        with requests.post(GROQ_API_URL, headers=headers, json=payload, stream=True, timeout=30) as resp:
            if resp.status_code != 200:
                yield {"error": "Lỗi kết nối AI."}
                return

            for line in resp.iter_lines():
                if not line: continue
                line_text = line.decode("utf-8").strip()
                if not line_text.startswith("data: "): continue
                data_str = line_text[len("data: "):]
                if data_str == "[DONE]": break

                try:
                    data = json.loads(data_str)
                    delta = data.get("choices", [{}])[0].get("delta", {})
                    content_chunk = delta.get("content", "")
                    if content_chunk:
                        full_response += content_chunk
                        yield content_chunk

                    usage = data.get("usage")
                    if usage:
                        tokens_used = usage.get("total_tokens", 0)
                except: continue

    except Exception as e:
        yield {"error": f"Lỗi streaming: {e}"}
        return

    response_time_ms = int((time.time() - start_time) * 1000)
    yield {
        "done": True,
        "full_response": full_response,
        "tokens_used": tokens_used,
        "response_time_ms": response_time_ms,
        "is_flagged": contains_sensitive_output(full_response),
    }
