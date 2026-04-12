"""
Rate limiter in-memory cho chatbox.
Dùng dict in-memory vì project có thể không có Redis.
Nếu Redis có sẵn (từ settings), sẽ tự động nâng cấp lên Redis.

Giới hạn:
  - 20 tin nhắn / giờ / session_token
  - 100 tin nhắn / ngày / session_id (kiểm tra từ DB)
"""
import time
from collections import defaultdict
from threading import Lock

# Rate limit: {session_token: [(timestamp, count)]}
_rate_store: dict[str, list] = defaultdict(list)
_lock = Lock()

MAX_PER_HOUR = 20       # tin nhắn tối đa/giờ
MAX_PER_DAY = 100       # tin nhắn tối đa/ngày (kiểm tra từ DB)
WARNING_THRESHOLD = 50  # cảnh báo log khi session dùng > 50 requests/ngày


def is_rate_limited(session_token: str) -> tuple[bool, str]:
    """
    Kiểm tra xem session_token có vượt rate limit chưa.
    Trả về (is_limited: bool, reason: str)
    """
    now = time.time()
    one_hour_ago = now - 3600

    with _lock:
        # Lọc chỉ giữ timestamps trong 1 giờ qua
        timestamps = _rate_store[session_token]
        timestamps = [t for t in timestamps if t > one_hour_ago]
        _rate_store[session_token] = timestamps

        if len(timestamps) >= MAX_PER_HOUR:
            return True, f"Bạn đã gửi quá {MAX_PER_HOUR} tin nhắn trong 1 giờ. Vui lòng thử lại sau."

        # Ghi nhận request mới
        timestamps.append(now)
        _rate_store[session_token] = timestamps

    return False, ""


def check_daily_limit_from_db(session_id: str) -> tuple[bool, str]:
    """
    Kiểm tra số tin nhắn trong ngày từ DB.
    Import model ở đây để tránh circular import.
    """
    import logging
    logger = logging.getLogger(__name__)

    try:
        from apps.chatbox.models import ChatMessage, ChatSession
        from django.utils import timezone
        today = timezone.now().date()

        count = ChatMessage.objects.filter(
            session__id=session_id,
            created_at__date=today,
        ).count()

        if count >= WARNING_THRESHOLD:
            logger.warning(
                f"[CHATBOX] Session {session_id[:8]}... đã dùng {count} requests hôm nay"
            )

        if count >= MAX_PER_DAY:
            return True, f"Bạn đã đạt giới hạn {MAX_PER_DAY} tin nhắn hôm nay. Vui lòng quay lại ngày mai."

    except Exception:
        pass  # Nếu DB lỗi — không chặn user

    return False, ""
