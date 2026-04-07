-- ============================================================
-- BOOKING SYSTEM MIGRATION
-- ============================================================

-- 1. Add user_categories table
CREATE TABLE IF NOT EXISTS user_categories (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    slug            VARCHAR(50) UNIQUE NOT NULL,
    discount_rate   DECIMAL(3, 2) DEFAULT 0.00,
    description     TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Seed categories
INSERT INTO user_categories (name, slug, discount_rate) VALUES
    ('Phổ thông',      'regular',  0.00),
    ('Sinh viên',      'student',  0.50),
    ('Trẻ em',         'child',    0.50),
    ('Người cao tuổi', 'elderly',  0.50)
ON CONFLICT (slug) DO NOTHING;

-- 2. Update users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS category_id INT DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth DATE;
-- Safely add the foreign key
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_users_category' AND conrelid = 'users'::regclass) THEN
        ALTER TABLE users ADD CONSTRAINT fk_users_category FOREIGN KEY (category_id) REFERENCES user_categories(id);
    END IF;
END $$;

-- 3. Update ticket_types
-- We need to add 'single' to the ENUM. PostgreSQL 12+ requires a separate transaction or ALTER TYPE.
-- Since we are in a script, we'll try to add it.
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'ticket_type' AND e.enumlabel = 'single') THEN
        ALTER TYPE ticket_type ADD VALUE 'single';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'ticket_status' AND e.enumlabel = 'used') THEN
        ALTER TYPE ticket_status ADD VALUE 'used';
    END IF;
END $$;

-- Seed 'Vé lượt'
INSERT INTO ticket_types (type, name, duration_days, price) 
VALUES ('single', 'Vé lượt', 0, 7000)
ON CONFLICT DO NOTHING;

-- Update existing ticket types if necessary
UPDATE ticket_types SET price = 40000 WHERE type = 'single_day';
UPDATE ticket_types SET price = 90000 WHERE type = 'three_day';
UPDATE ticket_types SET price = 150000 WHERE type = 'weekly';
UPDATE ticket_types SET price = 450000 WHERE type = 'monthly';
