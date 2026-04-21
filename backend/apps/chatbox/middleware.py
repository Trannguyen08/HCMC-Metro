import html
import json
import logging
import re
from django.http import JsonResponse
from apps.chatbox.config.blocklist import INPUT_BLOCKLIST
from apps.chatbox.services.rate_limiter import is_rate_limited

logger = logging.getLogger(__name__)

MAX_MESSAGE_LENGTH = 500

class ChatboxGuardMiddleware:
    """
    Middleware kiểm soát đầu vào cho Chatbox:
    1. Kiểm tra độ dài tin nhắn
    2. Rate limiting (per hour)
    3. Sanitize input
    4. Blocklist keywords
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.path == "/api/chatbox/message/" and request.method == "POST":
            try:
                data = json.loads(request.body)
                session_token = data.get("session_token", "").strip()
                raw_message = data.get("message", "").strip()

                # 1. Validate session token
                if not session_token or len(session_token) < 10:
                    return JsonResponse({"error": "session_token không hợp lệ."}, status=400)

                # 2. Rate limiting
                limited, reason = is_rate_limited(session_token)
                if limited:
                    return JsonResponse({"error": reason}, status=429)

                # 3. Validate tin nhắn length
                if not raw_message:
                    return JsonResponse({"error": "Tin nhắn không được để trống."}, status=400)
                
                if len(raw_message) > MAX_MESSAGE_LENGTH:
                    return JsonResponse({"error": f"Tin nhắn quá dài (tối đa {MAX_MESSAGE_LENGTH} ký tự)."}, status=400)

                # 4. Sanitize & Blocklist
                sanitized = self._sanitize(raw_message)
                # 4. Kiểm tra tin nhắn vô nghĩa / quá ngắn (VD: "...", "abc", "clmm")
                if len(sanitized) < 4 or self._is_blocked(sanitized):
                    return JsonResponse({"error": "Tôi chỉ hỗ trợ thông tin liên quan đến hệ thống Metro TP.HCM."}, status=400)
                # Gán lại data đã sanitize vào request (tùy chọn, ở đây ta để View xử lý tiếp hoặc dùng attr này)
                request.chatbox_sanitized_message = sanitized

            except json.JSONDecodeError:
                return JsonResponse({"error": "Invalid JSON"}, status=400)
            except Exception as e:
                logger.error(f"[ChatboxMiddleware] Error: {e}")
                return JsonResponse({"error": "Internal Server Error"}, status=500)

        return self.get_response(request)

    def _sanitize(self, text):
        text = html.escape(text)
        text = re.sub(r"<[^>]+>", "", text)
        text = re.sub(r"[\x00-\x08\x0b-\x0c\x0e-\x1f]", "", text)
        return text.strip()

    def _is_blocked(self, text):
        text_lower = text.lower()
        return any(kw.lower() in text_lower for kw in INPUT_BLOCKLIST)
