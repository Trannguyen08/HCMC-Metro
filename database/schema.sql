-- ============================================================
-- HCMC METRO SYSTEM - GROUND TRUTH SCHEMA
-- Generated from Django Models (No _en columns)
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. USERS & AUTHENTICATION
-- ============================================================

CREATE TABLE IF NOT EXISTS user_categories (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    slug            VARCHAR(50) UNIQUE NOT NULL,
    discount_rate   DECIMAL(3, 2) DEFAULT 0.00,
    description     TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   TEXT,
    full_name       VARCHAR(255) NOT NULL,
    phone           VARCHAR(20),
    date_of_birth   DATE,
    avatar_url      TEXT,
    is_active       BOOLEAN DEFAULT TRUE,
    is_admin        BOOLEAN DEFAULT FALSE,
    email_verified  BOOLEAN DEFAULT FALSE,
    category_id     INT REFERENCES user_categories(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS oauth_accounts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider        VARCHAR(50) NOT NULL,
    provider_id     VARCHAR(255) NOT NULL,
    access_token    TEXT,
    refresh_token   TEXT,
    token_expires_at TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(provider, provider_id)
);

-- ============================================================
-- 2. METRO INFRASTRUCTURE
-- ============================================================

CREATE TABLE IF NOT EXISTS metro_lines (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    code            VARCHAR(20) UNIQUE NOT NULL,
    color           VARCHAR(10),
    color_hex       VARCHAR(10) DEFAULT '#0066CC',
    stroke_weight   INT DEFAULT 4,
    geojson_coordinates JSONB,
    status          VARCHAR(30) DEFAULT 'active',
    description     TEXT,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stations (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    code            VARCHAR(20) UNIQUE NOT NULL,
    line_id         INT REFERENCES metro_lines(id) ON DELETE SET NULL,
    address         VARCHAR(500),
    latitude        DECIMAL(10, 8),
    longitude       DECIMAL(11, 8),
    sequence_order  INT,
    is_active       BOOLEAN DEFAULT TRUE,
    image_url       TEXT,
    description     TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trains (
    id              SERIAL PRIMARY KEY,
    train_number    VARCHAR(50) UNIQUE NOT NULL,
    line_id         INT REFERENCES metro_lines(id) ON DELETE SET NULL,
    capacity        INT,
    status          VARCHAR(30) DEFAULT 'active',
    manufacture_year INT,
    is_active       BOOLEAN DEFAULT TRUE,
    direction       VARCHAR(20) DEFAULT 'outbound',
    is_simulated    BOOLEAN DEFAULT TRUE,
    current_station_id INT REFERENCES stations(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. AMENITIES & MAP
-- ============================================================

CREATE TABLE IF NOT EXISTS amenity_categories (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    slug            VARCHAR(50) UNIQUE NOT NULL,
    icon_svg        TEXT,
    color_hex       VARCHAR(10) DEFAULT '#6B7280',
    bg_color_hex    VARCHAR(10) DEFAULT '#F3F4F6',
    sort_order      INT DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS amenity_types (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    icon_url        TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS amenities (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    station_id      INT REFERENCES stations(id) ON DELETE CASCADE,
    amenity_type_id INT REFERENCES amenity_types(id) ON DELETE SET NULL,
    category_id     INT REFERENCES amenity_categories(id) ON DELETE SET NULL,
    slug            VARCHAR(300),
    name            VARCHAR(255) NOT NULL,
    distance_meters INT,
    address         VARCHAR(500),
    latitude        DECIMAL(10, 8),
    longitude       DECIMAL(11, 8),
    image_url       TEXT,
    opening_hours   VARCHAR(255),
    description     TEXT,
    phone           VARCHAR(30),
    website         TEXT,
    rating          DECIMAL(2, 1),
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

DROP TABLE IF EXISTS bus_stop_cache;

CREATE TABLE IF NOT EXISTS bus_stops (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    code            VARCHAR(50) UNIQUE NOT NULL,
    latitude        DECIMAL(10, 8) NOT NULL,
    longitude       DECIMAL(11, 8) NOT NULL,
    address         VARCHAR(500),
    routes          JSONB,
    station_id      INT REFERENCES stations(id) ON DELETE SET NULL,
    distance_to_station INT,
    stop_type       VARCHAR(120),
    note            TEXT,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. NEWS
-- ============================================================

CREATE TABLE IF NOT EXISTS news_categories (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    slug            VARCHAR(100) UNIQUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS news (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id     INT REFERENCES news_categories(id) ON DELETE SET NULL,
    title           VARCHAR(500) NOT NULL,
    summary         TEXT,
    thumbnail_url   TEXT,
    slug            VARCHAR(500) UNIQUE,
    is_published    BOOLEAN DEFAULT FALSE,
    published_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. TICKETING & PAYMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS ticket_types (
    id              SERIAL PRIMARY KEY,
    type            VARCHAR(50) NOT NULL,
    name            VARCHAR(100) NOT NULL,
    duration_days   INT NOT NULL,
    price           DECIMAL(12, 2) NOT NULL,
    description     TEXT,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tickets (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ticket_type_id  INT NOT NULL REFERENCES ticket_types(id),
    qr_code         TEXT UNIQUE,
    status          VARCHAR(30) DEFAULT 'pending',
    valid_from      DATE NOT NULL,
    valid_until     DATE NOT NULL,
    from_station_id INT REFERENCES stations(id) ON DELETE SET NULL,
    to_station_id   INT REFERENCES stations(id) ON DELETE SET NULL,
    price_paid      DECIMAL(12, 2) NOT NULL,
    usage_remaining INT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ticket_scan_histories (
    id              BIGSERIAL PRIMARY KEY,
    ticket_id       UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    scanned_by      UUID REFERENCES users(id) ON DELETE SET NULL,
    scanned_at      TIMESTAMPTZ DEFAULT NOW(),
    scan_date       DATE NOT NULL,
    status_before   VARCHAR(30),
    status_after    VARCHAR(30),
    usage_remaining_before INT,
    usage_remaining_after INT,
    success         BOOLEAN DEFAULT FALSE,
    message         TEXT
);

CREATE TABLE IF NOT EXISTS payments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id       UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount          DECIMAL(12, 2) NOT NULL,
    method          VARCHAR(50),
    status          VARCHAR(30) DEFAULT 'pending',
    transaction_ref VARCHAR(255) UNIQUE,
    paid_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. CHATBOX
-- ============================================================

CREATE TABLE IF NOT EXISTS chat_sessions (
    id              VARCHAR(36) PRIMARY KEY,
    session_token   VARCHAR(255) UNIQUE NOT NULL,
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    message_count   INT DEFAULT 0,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id              BIGSERIAL PRIMARY KEY,
    session_id      VARCHAR(36) NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role            VARCHAR(20) NOT NULL,
    content         TEXT NOT NULL,
    tokens_used     INT DEFAULT 0,
    response_time_ms INT DEFAULT 0,
    is_flagged      BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. FEEDBACK
-- ============================================================

CREATE TABLE IF NOT EXISTS feedbacks (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type            VARCHAR(30) NOT NULL, -- facility, experience, error
    content         TEXT NOT NULL,
    train_id        INT REFERENCES trains(id) ON DELETE SET NULL,
    status          VARCHAR(30) DEFAULT 'pending', -- pending, processing, resolved, rejected
    rating          INT DEFAULT 5,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- 7. TRIGGERS & INDEXES
-- ============================================================

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_amenities_updated_at BEFORE UPDATE ON amenities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_bus_stops_updated_at BEFORE UPDATE ON bus_stops FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_news_updated_at BEFORE UPDATE ON news FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_tickets_updated_at BEFORE UPDATE ON tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_chat_sessions_updated_at BEFORE UPDATE ON chat_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_feedbacks_updated_at BEFORE UPDATE ON feedbacks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Core Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_stations_line ON stations(line_id);
CREATE INDEX idx_bus_stops_station ON bus_stops(station_id);
CREATE INDEX idx_tickets_user ON tickets(user_id);
CREATE INDEX idx_payments_ticket ON payments(ticket_id);
CREATE INDEX idx_news_slug ON news(slug);
CREATE INDEX idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX idx_feedbacks_user ON feedbacks(user_id);

-- ============================================================
-- 8. SEED DATA - ADMIN ACCOUNT
-- ============================================================
-- Default admin account created automatically from .env configuration
-- Email: admin@metrohcm.vn
-- Password: admin123 (should be changed in production)
-- PBKDF2 hash generated for development use

INSERT INTO users (
    id,
    email,
    password_hash,
    full_name,
    phone,
    is_active,
    is_admin,
    email_verified,
    created_at,
    updated_at
)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'admin@metrohcm.vn',
    'pbkdf2_sha256$260000$SaltForAdminAccount$7x7N8f2K3jZ9vY4mL5pQ2rT8sU1wX3vY5zA8bC1dE2fG=',
    'Administrator',
    '+84 28 1234 5678',
    TRUE,
    TRUE,
    TRUE,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO NOTHING;
