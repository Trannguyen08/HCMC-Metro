from django.urls import path
from apps.chatbox.views import chatbox

urlpatterns = [
    # POST — gửi tin nhắn, nhận SSE stream
    path("message/", chatbox.send_message, name="chatbox_send_message"),
    # GET — lấy lịch sử hội thoại theo session_token
    path("history/<str:session_token>/", chatbox.get_history, name="chatbox_get_history"),
    # DELETE — xoá lịch sử (cuộc trò chuyện mới)
    path("history/<str:session_token>/delete/", chatbox.delete_history, name="chatbox_delete_history"),
]
