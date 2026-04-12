"""
Chatbox views — controller cho các API endpoint:
  POST   /api/chatbox/message/           — nhận tin, trả về SSE stream
  GET    /api/chatbox/history/<token>/   — lấy lịch sử hội thoại
  DELETE /api/chatbox/history/<token>/   — xoá lịch sử (cuộc trò chuyện mới)
"""
import html
import json
import logging
import re
import uuid

from django.http import StreamingHttpResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

from apps.chatbox.config.blocklist import INPUT_BLOCKLIST
from apps.chatbox.models import ChatMessage, ChatSession
from apps.chatbox.services.chatbox_ai import build_messages, stream_groq_response
from apps.chatbox.services.rate_limiter import check_daily_limit_from_db, is_rate_limited

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
#  Helper: lấy hoặc tạo session
# ---------------------------------------------------------------------------

def _get_or_create_session(session_token: str, user_id: str | None = None) -> ChatSession:
    """Lấy hoặc tạo ChatSession theo session_token."""
    session, created = ChatSession.objects.get_or_create(
        session_token=session_token,
        defaults={
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "is_active": True,
        },
    )
    return session


# ---------------------------------------------------------------------------
#  POST /api/chatbox/message/
# ---------------------------------------------------------------------------

@api_view(["POST"])
@permission_classes([AllowAny])
def send_message(request):
    """
    Nhận tin nhắn từ user, trả về Server-Sent Events stream.
    Body: { "message": str, "session_token": str }
    """
    body = request.data
    session_token = body.get("session_token", "").strip()
    raw_message = body.get("message", "").strip()

    # Sử dụng tin nhắn đã được sanitize từ middleware (nếu có)
    message = getattr(request, 'chatbox_sanitized_message', raw_message)

    # --- Lấy hoặc tạo session ---

    # --- Lấy hoặc tạo session ---
    try:
        user_id = None
        # Nếu user đã đăng nhập (JWT), lấy user_id từ request.auth
        if hasattr(request, "auth") and request.auth:
            user_id = str(request.auth.payload.get("user_id", ""))

        session = _get_or_create_session(session_token, user_id)
    except Exception as e:
        logger.error(f"[CHATBOX] Lỗi tạo session: {e}")
        return Response(
            {"error": "Lỗi khởi tạo phiên trò chuyện."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    # --- Kiểm tra giới hạn hàng ngày ---
    daily_limited, daily_reason = check_daily_limit_from_db(session.id)
    if daily_limited:
        return Response({"error": daily_reason}, status=status.HTTP_429_TOO_MANY_REQUESTS)

    # --- Lưu tin nhắn user vào DB ---
    try:
        ChatMessage.objects.create(
            session=session,
            role="user",
            content=message,
        )
    except Exception as e:
        logger.error(f"[CHATBOX] Lỗi lưu tin nhắn user: {e}")

    # --- Lấy lịch sử 10 tin gần nhất để đưa vào context ---
    try:
        history_qs = ChatMessage.objects.filter(session=session).order_by("-created_at")[:10]
        history = [
            {"role": msg.role, "content": msg.content}
            for msg in reversed(list(history_qs))
            if msg.role in ("user", "assistant") and msg.content != message  # bỏ tin vừa thêm
        ]
    except Exception:
        history = []

    # --- Xây messages và stream ---
    messages = build_messages(history, message)

    def sse_generator():
        """Generator SSE: yield từng chunk từ Groq API."""
        full_response = ""
        tokens_used = 0
        response_time_ms = 0
        is_flagged = False
        had_error = False

        for chunk in stream_groq_response(messages):
            if isinstance(chunk, dict):
                if "error" in chunk:
                    # Gửi lỗi về client theo format SSE
                    had_error = True
                    error_msg = chunk["error"]
                    yield f"data: {json.dumps({'error': error_msg})}\n\n"
                    break
                elif chunk.get("done"):
                    full_response = chunk.get("full_response", "")
                    tokens_used = chunk.get("tokens_used", 0)
                    response_time_ms = chunk.get("response_time_ms", 0)
                    is_flagged = chunk.get("is_flagged", False)
            else:
                # String chunk — gửi về client
                yield f"data: {json.dumps({'content': chunk})}\n\n"

        # Tín hiệu kết thúc stream
        yield "data: [DONE]\n\n"

        # Lưu tin nhắn assistant vào DB (nếu không có lỗi)
        if not had_error and full_response:
            try:
                ChatMessage.objects.create(
                    session=session,
                    role="assistant",
                    content=full_response,
                    tokens_used=tokens_used,
                    response_time_ms=response_time_ms,
                    is_flagged=is_flagged,
                )
                # Cập nhật message_count
                ChatSession.objects.filter(id=session.id).update(
                    message_count=ChatMessage.objects.filter(session=session).count()
                )
            except Exception as e:
                logger.error(f"[CHATBOX] Lỗi lưu tin nhắn assistant: {e}")

    response = StreamingHttpResponse(
        sse_generator(),
        content_type="text/event-stream; charset=utf-8",
    )
    response["Cache-Control"] = "no-cache"
    response["X-Accel-Buffering"] = "no"  # Tắt buffering của Nginx
    return response


# ---------------------------------------------------------------------------
#  GET /api/chatbox/history/<session_token>/
# ---------------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([AllowAny])
def get_history(request, session_token: str):
    """Trả về danh sách tin nhắn của session."""
    if not session_token or len(session_token) < 10:
        return Response({"error": "session_token không hợp lệ."}, status=400)

    try:
        session = ChatSession.objects.filter(session_token=session_token, is_active=True).first()
        if not session:
            return Response({"messages": [], "session_id": None})

        messages = ChatMessage.objects.filter(session=session).order_by("created_at")
        data = [
            {
                "id": str(msg.id),
                "role": msg.role,
                "content": msg.content,
                "created_at": msg.created_at.isoformat(),
                "is_flagged": msg.is_flagged,
            }
            for msg in messages
        ]
        return Response({"messages": data, "session_id": str(session.id)})

    except Exception as e:
        logger.error(f"[CHATBOX] Lỗi lấy lịch sử: {e}")
        return Response({"messages": [], "session_id": None})


# ---------------------------------------------------------------------------
#  DELETE /api/chatbox/history/<session_token>/
# ---------------------------------------------------------------------------

@api_view(["DELETE"])
@permission_classes([AllowAny])
def delete_history(request, session_token: str):
    """Đánh dấu session cũ là inactive (cuộc trò chuyện mới)."""
    if not session_token or len(session_token) < 10:
        return Response({"error": "session_token không hợp lệ."}, status=400)

    try:
        updated = ChatSession.objects.filter(session_token=session_token).update(is_active=False)
        return Response({"success": True, "sessions_closed": updated})
    except Exception as e:
        logger.error(f"[CHATBOX] Lỗi xoá lịch sử: {e}")
        return Response({"success": False}, status=500)
