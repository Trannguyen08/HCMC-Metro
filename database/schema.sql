-- ============================================================
-- METRO / TRAIN TICKETING SYSTEM - PostgreSQL Database Schema
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- CREATE EXTENSION IF NOT EXISTS "postgis"; -- For map/geo features (optional)

-- ============================================================
-- 1. AUTHENTICATION & USER MANAGEMENT
-- ============================================================

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   TEXT,                        -- NULL nếu đăng nhập bằng Google
    full_name       VARCHAR(255) NOT NULL,
    phone           VARCHAR(20),
    date_of_birth   DATE,
    avatar_url      TEXT,
    is_active       BOOLEAN DEFAULT TRUE,
    is_admin        BOOLEAN DEFAULT FALSE,
    email_verified  BOOLEAN DEFAULT FALSE,
    category_id     INT DEFAULT 1, -- Defaults to Regular
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 1.1 USER CATEGORIES (ĐỐI TƯỢNG GIẢM GIÁ)
-- ============================================================

CREATE TABLE user_categories (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL, -- 'Sinh viên', 'Trẻ em', 'Người cao tuổi', 'Phổ thông'
    slug            VARCHAR(50) UNIQUE NOT NULL,
    discount_rate   DECIMAL(3, 2) DEFAULT 0.00, -- 0.50 = 50% off
    description     TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default categories
INSERT INTO user_categories (name, slug, discount_rate) VALUES
    ('Phổ thông',      'regular',  0.00),
    ('Sinh viên',      'student',  0.50),
    ('Trẻ em',         'child',    0.50),
    ('Người cao tuổi', 'elderly',  0.50);

-- Link users to categories
ALTER TABLE users ADD CONSTRAINT fk_user_category FOREIGN KEY (category_id) REFERENCES user_categories(id);

-- Đăng nhập với Google (OAuth)
CREATE TABLE oauth_accounts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider        VARCHAR(50) NOT NULL,        -- 'google', 'facebook', ...
    provider_id     VARCHAR(255) NOT NULL,       -- Google sub ID
    access_token    TEXT,
    refresh_token   TEXT,
    token_expires_at TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(provider, provider_id)
);

-- Phiên đăng nhập / JWT refresh token
CREATE TABLE user_sessions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token   TEXT UNIQUE NOT NULL,
    device_info     VARCHAR(500),
    ip_address      INET,
    expires_at      TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. NEWS (TIN TỨC)
-- ============================================================

CREATE TABLE news_categories (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,       -- 'Thông báo', 'Sự kiện', 'Khuyến mãi', ...
    name_en         VARCHAR(100),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE news (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id     INT REFERENCES news_categories(id) ON DELETE SET NULL,
    title           VARCHAR(500) NOT NULL,
    title_en        VARCHAR(500),
    summary         TEXT,                        -- Nội dung ngắn gọn
    summary_en      TEXT,
    thumbnail_url   TEXT,                        -- Ảnh đại diện
    external_link   TEXT,                        -- Link bài đăng gốc (nếu có)
    slug            VARCHAR(500) UNIQUE,
    is_published    BOOLEAN DEFAULT FALSE,
    published_at    TIMESTAMPTZ,
    created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. GA & TÀU
-- ============================================================

CREATE TABLE metro_lines (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,       -- 'Tuyến 1', 'Tuyến 2', ...
    name_en         VARCHAR(100),
    code            VARCHAR(20) UNIQUE NOT NULL, -- 'L1', 'L2'
    color           VARCHAR(10),                 -- Hex color: '#FF0000'
    color_hex       VARCHAR(10) DEFAULT '#0066CC',
    stroke_weight   INT DEFAULT 4,
    geojson_coordinates JSONB,
    status          VARCHAR(30) DEFAULT 'active',
    description     TEXT,
    description_en  TEXT,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE stations (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    name_en         VARCHAR(255),
    code            VARCHAR(20) UNIQUE NOT NULL, -- 'BT', 'TP', 'SG', ...
    line_id         INT REFERENCES metro_lines(id) ON DELETE SET NULL,
    address         VARCHAR(500),
    address_en      VARCHAR(500),
    latitude        DECIMAL(10, 8),
    longitude       DECIMAL(11, 8),
    sequence_order  INT,                         -- Thứ tự trên tuyến
    is_active       BOOLEAN DEFAULT TRUE,
    image_url       TEXT,
    description     TEXT,
    description_en  TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE trains (
    id              SERIAL PRIMARY KEY,
    train_number    VARCHAR(50) UNIQUE NOT NULL,
    line_id         INT REFERENCES metro_lines(id) ON DELETE SET NULL,
    capacity        INT,
    status          VARCHAR(30) DEFAULT 'active', -- 'active', 'maintenance', 'out_of_service'
    is_active       BOOLEAN DEFAULT TRUE,
    manufacture_year INT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Lịch trình tàu
CREATE TABLE train_schedules (
    id              SERIAL PRIMARY KEY,
    train_id        INT REFERENCES trains(id) ON DELETE CASCADE,
    station_id      INT REFERENCES stations(id) ON DELETE CASCADE,
    arrival_time    TIME NOT NULL,
    departure_time  TIME NOT NULL,
    day_of_week     SMALLINT[],                  -- {1,2,3,4,5} = Mon-Fri
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. VÉ & ĐẶT VÉ
-- ============================================================

CREATE TYPE ticket_type AS ENUM ('single', 'single_day', 'three_day', 'weekly', 'monthly');
CREATE TYPE ticket_status AS ENUM ('active', 'expired', 'cancelled', 'pending', 'used');

CREATE TABLE ticket_types (
    id              SERIAL PRIMARY KEY,
    type            ticket_type NOT NULL,
    name            VARCHAR(100) NOT NULL,       -- 'Vé ngày', 'Vé 3 ngày', 'Vé tuần', 'Vé tháng'
    name_en         VARCHAR(100),
    duration_days   INT NOT NULL,                -- 1, 3, 7, 30
    price           DECIMAL(12, 2) NOT NULL,
    description     TEXT,
    description_en  TEXT,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Insert mặc định các loại vé
INSERT INTO ticket_types (type, name, duration_days, price) VALUES
    ('single',      'Vé lượt',    0,  7000), -- Base price for single trip
    ('single_day',  'Vé ngày',   1,  40000),
    ('three_day',   'Vé 3 ngày', 3,  90000),
    ('weekly',      'Vé tuần',   7,  150000),
    ('monthly',     'Vé tháng',  30, 450000);

CREATE TABLE tickets (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ticket_type_id  INT NOT NULL REFERENCES ticket_types(id),
    qr_code         TEXT UNIQUE,                 -- Mã QR để soát vé
    status          ticket_status DEFAULT 'pending',
    valid_from      DATE NOT NULL,
    valid_until     DATE NOT NULL,
    -- Thông tin ga (nếu vé theo tuyến / ga cụ thể)
    from_station_id INT REFERENCES stations(id),
    to_station_id   INT REFERENCES stations(id),
    price_paid      DECIMAL(12, 2) NOT NULL,
    usage_remaining INT,                          -- NULL = khong gioi han (ve ngay/tuan/thang), 1/2 cho ve luot
    purchase_note   TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Lịch sử gia hạn vé (weekly, monthly)
CREATE TABLE ticket_renewals (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    original_ticket_id UUID REFERENCES tickets(id) ON DELETE SET NULL,
    new_ticket_id   UUID REFERENCES tickets(id) ON DELETE SET NULL,
    renewed_at      TIMESTAMPTZ DEFAULT NOW(),
    renewed_by      UUID REFERENCES users(id) ON DELETE SET NULL,
    notes           TEXT
);

-- Thanh toán đặt vé
CREATE TABLE payments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id       UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount          DECIMAL(12, 2) NOT NULL,
    method          VARCHAR(50),                 -- 'momo', 'vnpay', 'card', 'cash'
    status          VARCHAR(30) DEFAULT 'pending', -- 'pending', 'success', 'failed', 'refunded'
    transaction_ref VARCHAR(255) UNIQUE,         -- Mã giao dịch bên cổng thanh toán
    paid_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. TIỆN ÍCH QUANH GA
-- ============================================================

CREATE TABLE amenity_categories (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    name_en         VARCHAR(100),
    slug            VARCHAR(50) UNIQUE NOT NULL,
    icon_svg        TEXT,
    color_hex       VARCHAR(10) DEFAULT '#6B7280',
    bg_color_hex    VARCHAR(10) DEFAULT '#F3F4F6',
    sort_order      INT DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE amenity_types (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,       -- 'Nhà hàng', 'ATM', 'Siêu thị', 'Bệnh viện', ...
    name_en         VARCHAR(100),
    icon_url        TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE amenities (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    station_id      INT REFERENCES stations(id) ON DELETE CASCADE,
    amenity_type_id INT REFERENCES amenity_types(id) ON DELETE SET NULL,
    category_id     INT REFERENCES amenity_categories(id) ON DELETE SET NULL,
    name            VARCHAR(255) NOT NULL,       -- Tên tiện ích
    name_en         VARCHAR(255),
    slug            VARCHAR(300),
    distance_meters INT,                         -- Cách ga bao nhiêu mét
    address         VARCHAR(500),
    address_en      VARCHAR(500),
    latitude        DECIMAL(10, 8),
    longitude       DECIMAL(11, 8),
    image_url       TEXT,
    opening_hours   VARCHAR(255),                -- VD: 'T2-T6: 7:00-22:00, T7-CN: 8:00-21:00'
    opening_hours_en VARCHAR(255),
    description     TEXT,                        -- Giới thiệu
    description_en  TEXT,
    phone           VARCHAR(30),
    website         TEXT,
    rating          DECIMAL(2, 1),               -- 0.0 - 5.0
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Ảnh phụ cho tiện ích (nhiều ảnh)
CREATE TABLE amenity_images (
    id              SERIAL PRIMARY KEY,
    amenity_id      UUID NOT NULL REFERENCES amenities(id) ON DELETE CASCADE,
    image_url       TEXT NOT NULL,
    caption         VARCHAR(255),
    sort_order      INT DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. BẢN ĐỒ SỐ
-- ============================================================

-- Bảng này mở rộng station với dữ liệu hiển thị bản đồ
-- (stations đã có lat/lng, bảng này chứa thêm cấu hình map UI)
CREATE TABLE map_configs (
    id              SERIAL PRIMARY KEY,
    station_id      INT UNIQUE NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
    map_icon_url    TEXT,
    map_zoom_level  INT DEFAULT 15,
    display_label   VARCHAR(255),
    popup_content   TEXT,                        -- HTML snippet hiển thị popup
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE bus_stop_cache (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    code            VARCHAR(50),
    latitude        DECIMAL(10, 8) NOT NULL,
    longitude       DECIMAL(11, 8) NOT NULL,
    address         VARCHAR(500),
    routes          TEXT[],
    station_id      INT REFERENCES stations(id) ON DELETE SET NULL,
    distance_to_station INT,
    fetched_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. PROFILE & THÔNG TIN CÁ NHÂN (mở rộng từ users)
-- ============================================================

CREATE TABLE user_profiles (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    national_id     VARCHAR(20),                 -- CCCD/CMND
    gender          VARCHAR(10),                 -- 'male', 'female', 'other'
    address         VARCHAR(500),
    emergency_contact VARCHAR(100),
    emergency_phone VARCHAR(20),
    preferences     JSONB DEFAULT '{}',          -- Cài đặt cá nhân, thông báo, ...
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 8. NOTIFICATIONS (Thông báo hệ thống)
-- ============================================================

CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           VARCHAR(255) NOT NULL,
    body            TEXT,
    type            VARCHAR(50),                 -- 'ticket_expiry', 'news', 'system'
    is_read         BOOLEAN DEFAULT FALSE,
    related_id      UUID,                        -- ID ticket / news liên quan
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES (Tối ưu truy vấn)
-- ============================================================

CREATE INDEX idx_users_email             ON users(email);
CREATE INDEX idx_oauth_provider          ON oauth_accounts(provider, provider_id);
CREATE INDEX idx_news_published          ON news(published_at DESC) WHERE is_published = TRUE;
CREATE INDEX idx_news_category           ON news(category_id);
CREATE INDEX idx_stations_line           ON stations(line_id);
CREATE INDEX idx_stations_geo            ON stations(latitude, longitude);
CREATE INDEX idx_tickets_user            ON tickets(user_id);
CREATE INDEX idx_tickets_status          ON tickets(status);
CREATE INDEX idx_tickets_valid           ON tickets(valid_from, valid_until);
CREATE INDEX idx_amenities_station       ON amenities(station_id);
CREATE INDEX idx_amenities_type          ON amenities(amenity_type_id);
CREATE INDEX idx_amenities_distance      ON amenities(station_id, distance_meters);
CREATE INDEX idx_notifications_user      ON notifications(user_id, is_read);

-- ============================================================
-- VIEWS (Truy vấn tiện lợi)
-- ============================================================

-- Vé đang active của user
CREATE VIEW v_active_tickets AS
SELECT
    t.id,
    t.user_id,
    u.full_name,
    u.email,
    tt.name         AS ticket_type_name,
    tt.type         AS ticket_type,
    t.valid_from,
    t.valid_until,
    t.qr_code,
    t.status,
    s1.name         AS from_station,
    s2.name         AS to_station,
    t.price_paid,
    t.created_at,
    u.is_admin
FROM tickets t
JOIN users u        ON t.user_id = u.id
JOIN ticket_types tt ON t.ticket_type_id = tt.id
LEFT JOIN stations s1 ON t.from_station_id = s1.id
LEFT JOIN stations s2 ON t.to_station_id = s2.id
WHERE t.status = 'active'
  AND t.valid_until >= CURRENT_DATE;

-- Tiện ích xung quanh ga (cho bản đồ)
CREATE VIEW v_station_amenities AS
SELECT
    a.id            AS amenity_id,
    a.station_id,
    s.name          AS station_name,
    s.latitude      AS station_lat,
    s.longitude     AS station_lng,
    at2.name        AS amenity_type,
    a.name          AS amenity_name,
    a.distance_meters,
    a.address,
    a.latitude      AS amenity_lat,
    a.longitude     AS amenity_lng,
    a.image_url,
    a.opening_hours,
    a.description,
    a.rating
FROM amenities a
JOIN stations s     ON a.station_id = s.id
JOIN amenity_types at2 ON a.amenity_type_id = at2.id
WHERE a.is_active = TRUE;

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Tự động cập nhật updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_tickets_updated_at
    BEFORE UPDATE ON tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_amenities_updated_at
    BEFORE UPDATE ON amenities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_news_updated_at
    BEFORE UPDATE ON news
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Tự động tạo QR code cho vé khi insert
CREATE OR REPLACE FUNCTION generate_ticket_qr()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.qr_code IS NULL THEN
        NEW.qr_code = 'QR-' || UPPER(REPLACE(NEW.id::TEXT, '-', ''));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ticket_qr
    BEFORE INSERT ON tickets
    FOR EACH ROW EXECUTE FUNCTION generate_ticket_qr();

-- Tự động hết hạn vé (có thể chạy bằng cron job / pg_cron)
CREATE OR REPLACE FUNCTION expire_old_tickets()
RETURNS void AS $$
BEGIN
    UPDATE tickets
    SET status = 'expired', updated_at = NOW()
    WHERE status = 'active'
      AND valid_until < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- SAMPLE DATA (Dữ liệu mẫu)
-- ============================================================

-- Loại tin tức
INSERT INTO news_categories (name, slug) VALUES
    ('Thông báo',  'thong-bao'),
    ('Sự kiện',    'su-kien'),
    ('Khuyến mãi', 'khuyen-mai'),
    ('Hướng dẫn',  'huong-dan');

-- Tuyến metro
INSERT INTO metro_lines (name, code, color, description) VALUES
    ('Tuyến 1 - Bến Thành – Suối Tiên', 'L1', '#0066CC', 'Tuyến metro đầu tiên tại TP.HCM'),
    ('Tuyến 2 - Bến Thành – Tham Lương', 'L2', '#FF6600', 'Tuyến metro số 2');

-- Ga metro tuyến 1
INSERT INTO stations (name, code, line_id, address, latitude, longitude, sequence_order) VALUES
    ('Bến Thành',       'BT',  1, 'Quận 1, TP.HCM',           10.7721, 106.6980, 1),
    ('Nhà hát TP',      'NHTP',1, 'Quận 1, TP.HCM',           10.7769, 106.7030, 2),
    ('Ba Son',          'BS',  1, 'Quận 1, TP.HCM',           10.7873, 106.7047, 3),
    ('Văn Thánh',       'VT',  1, 'Bình Thạnh, TP.HCM',       10.7985, 106.7165, 4),
    ('Tân Cảng',        'TC',  1, 'Bình Thạnh, TP.HCM',       10.8046, 106.7238, 5),
    ('Thảo Điền',       'TD',  1, 'Quận 2, TP.HCM',           10.8102, 106.7371, 6),
    ('An Phú',          'AP',  1, 'Quận 2, TP.HCM',           10.8159, 106.7483, 7),
    ('Rạch Chiếc',      'RC',  1, 'Quận 9, TP.HCM',           10.8274, 106.7645, 8),
    ('Phước Long',      'PL',  1, 'Quận 9, TP.HCM',           10.8381, 106.7756, 9),
    ('Bình Thái',       'BThai',1,'Quận 9, TP.HCM',           10.8434, 106.7868, 10),
    ('Thủ Đức',         'TDu', 1, 'TP Thủ Đức, TP.HCM',       10.8512, 106.7953, 11),
    ('Khu Công nghệ cao','KCNC',1,'TP Thủ Đức, TP.HCM',       10.8598, 106.8034, 12),
    ('Đại học Quốc gia','DHQG',1,'TP Thủ Đức, TP.HCM',        10.8685, 106.8034, 13),
    ('Suối Tiên',       'ST',  1, 'TP Thủ Đức, TP.HCM',       10.8746, 106.8065, 14);

-- Loại tiện ích
INSERT INTO amenity_types (name) VALUES
    ('Nhà hàng'),
    ('Cà phê'),
    ('ATM / Ngân hàng'),
    ('Siêu thị / Cửa hàng tiện lợi'),
    ('Bệnh viện / Phòng khám'),
    ('Khách sạn'),
    ('Bãi giữ xe'),
    ('Trạm xe buýt'),
    ('Trung tâm thương mại'),
    ('Công viên');

-- ============================================================
-- END OF SCHEMA
-- ============================================================
