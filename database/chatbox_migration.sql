-- ============================================================
-- CHATBOX MIGRATION — Chat Sessions & Messages
-- Run this manually against the PostgreSQL database.
-- ============================================================

-- Bảng phiên hội thoại
CREATE TABLE IF NOT EXISTS chat_sessions (
    id              VARCHAR(36) PRIMARY KEY,           -- UUID dạng string
    session_token   VARCHAR(255) UNIQUE NOT NULL,      -- token định danh user (từ localStorage)
    user_id         UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    message_count   INT DEFAULT 0,                     -- đếm số tin nhắn trong session
    is_active       BOOLEAN DEFAULT TRUE
);

-- Bảng tin nhắn
CREATE TABLE IF NOT EXISTS chat_messages (
    id              BIGSERIAL PRIMARY KEY,
    session_id      VARCHAR(36) NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role            VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    content         TEXT NOT NULL,
    tokens_used     INT DEFAULT 0,                     -- lưu token để kiểm soát chi phí
    response_time_ms INT DEFAULT 0,                    -- thời gian phản hồi (ms)
    is_flagged      BOOLEAN DEFAULT FALSE,             -- đánh dấu nội dung bị từ chối
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes tối ưu truy vấn
CREATE INDEX IF NOT EXISTS idx_chat_sessions_token   ON chat_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user    ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id, created_at DESC);

-- Trigger tự động cập nhật updated_at cho chat_sessions
CREATE OR REPLACE FUNCTION update_chat_session_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_chat_sessions_updated_at ON chat_sessions;
CREATE TRIGGER trg_chat_sessions_updated_at
    BEFORE UPDATE ON chat_sessions
    FOR EACH ROW EXECUTE FUNCTION update_chat_session_updated_at();
