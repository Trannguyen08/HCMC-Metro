# Danh sách từ khoá bị chặn ở đầu vào
# Nếu tin nhắn chứa bất kỳ từ nào trong list này → từ chối ngay, không gọi AI

INPUT_BLOCKLIST = [
    # Bảo mật hệ thống
    "hack", "hacker", "exploit", "sql injection", "xss", "csrf",
    "password", "passwd", "secret", "api_key", "apikey", "token",
    "admin123", "root", "sudo",
    # Nội dung không phù hợp & Từ lóng (Vietnamese Slang/Profanity)
    "chính trị", "tôn giáo", "phân biệt", "kỳ thị",
    "bạo lực", "khủng bố", "ma túy", "cờ bạc",
    "đm", "dm", "clmm", "vcl", "vl", "đm", "cút", "ngu", "óc chó",
    "sex", "18+", "porn", "xxx",
    # Các câu hỏi rủi ro/không liên quan
    "code", "lập trình", "viết bài", "làm thơ", "kể chuyện",
    "yêu", "thả thính", "crush",
    # English
    "drugs", "terrorism", "violence", "gambling", "porn",
    "political", "religion", "discrimination",
]

# Từ khoá nhạy cảm trong OUTPUT của AI — nếu xuất hiện → set is_flagged=True
OUTPUT_SENSITIVE_KEYWORDS = [
    "mật khẩu", "password", "api key", "token", "secret",
    "hack", "exploit", "sql", "injection",
]
