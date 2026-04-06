-- ============================================================
-- MAP FEATURE MIGRATION
-- Run this against an existing HCMC-Metro database
-- ============================================================

-- 1. ALTER metro_lines: add map-specific columns
ALTER TABLE metro_lines
    ADD COLUMN IF NOT EXISTS color_hex VARCHAR(10) DEFAULT '#0066CC',
    ADD COLUMN IF NOT EXISTS stroke_weight INT DEFAULT 4,
    ADD COLUMN IF NOT EXISTS geojson_coordinates JSONB,
    ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'active';

-- Backfill color_hex from existing color column
UPDATE metro_lines SET color_hex = color WHERE color IS NOT NULL AND color_hex IS NULL;

-- Seed geojson_coordinates for Line 1
UPDATE metro_lines SET geojson_coordinates = '[
  [106.6976235, 10.7707525],
  [106.7011186, 10.7744228],
  [106.7032012, 10.7763099],
  [106.7076387, 10.7810928],
  [106.7116613, 10.7854683],
  [106.7133090, 10.7900218],
  [106.7134950, 10.7932080],
  [106.7146351, 10.7954005],
  [106.7163491, 10.7967476],
  [106.7183460, 10.7979246],
  [106.7214636, 10.7983480],
  [106.7247763, 10.7988451],
  [106.7302263, 10.7998613],
  [106.7342689, 10.8006298],
  [106.7371744, 10.8011719],
  [106.7416085, 10.8020864],
  [106.7457001, 10.8028319],
  [106.7492012, 10.8035749],
  [106.7513752, 10.8045426],
  [106.7530183, 10.8060008],
  [106.7541809, 10.8070060],
  [106.7554306, 10.8088710],
  [106.7562310, 10.8112669],
  [106.7568369, 10.8145027],
  [106.7577177, 10.8194995],
  [106.7583319, 10.8220483],
  [106.7593225, 10.8245436],
  [106.7635847, 10.8321408],
  [106.7655669, 10.8356524],
  [106.7695677, 10.8427553],
  [106.7719468, 10.8469651],
  [106.7736891, 10.8494494],
  [106.7755480, 10.8511216],
  [106.7811837, 10.8545301],
  [106.7883825, 10.8587590],
  [106.7937055, 10.8618623],
  [106.8007582, 10.8660601],
  [106.8035609, 10.8678502],
  [106.8055296, 10.8696096],
  [106.8074136, 10.8719836],
  [106.8099432, 10.8754446],
  [106.8123176, 10.8770878],
  [106.8140678, 10.8796111]
]'::jsonb,
stroke_weight = 5
WHERE code = 'L1';

-- Xoá toạ độ geojson của Tuyến 2 (L2) vì chưa hoạt động, tránh làm kẹt bản đồ
UPDATE metro_lines SET geojson_coordinates = NULL,
stroke_weight = 4
WHERE code = 'L2';


-- 2. Create amenity_categories table
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

-- Seed 6 categories
INSERT INTO amenity_categories (name, slug, icon_svg, color_hex, bg_color_hex, sort_order) VALUES
    ('Cà phê',      'cafe',       '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" x2="6" y1="2" y2="4"/><line x1="10" x2="10" y1="2" y2="4"/><line x1="14" x2="14" y1="2" y2="4"/></svg>',     '#D97706', '#FEF3C7', 1),
    ('Nhà hàng',    'restaurant', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>', '#DC2626', '#FEE2E2', 2),
    ('Mua sắm',     'shopping',   '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>',             '#7C3AED', '#EDE9FE', 3),
    ('Khách sạn',   'hotel',      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Z"/><path d="m9 16 .348-.24c1.465-1.013 3.84-1.013 5.304 0L15 16"/><path d="M8 7h.01"/><path d="M16 7h.01"/><path d="M12 7h.01"/><path d="M12 11h.01"/><path d="M16 11h.01"/><path d="M8 11h.01"/></svg>', '#2563EB', '#DBEAFE', 4),
    ('Dịch vụ',     'service',    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',                                                                                                    '#059669', '#D1FAE5', 5),
    ('Trạm xe buýt','bus-stop',   '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/></svg>',                '#0891B2', '#CFFAFE', 6)
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;


-- 3. ALTER amenities: add category_id FK and slug
ALTER TABLE amenities
    ADD COLUMN IF NOT EXISTS category_id INT REFERENCES amenity_categories(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS slug VARCHAR(300);

-- Make station_id nullable (amenities on map may not be tied to a station)
ALTER TABLE amenities ALTER COLUMN station_id DROP NOT NULL;

-- Create index on slug
CREATE INDEX IF NOT EXISTS idx_amenities_slug ON amenities(slug);
CREATE INDEX IF NOT EXISTS idx_amenities_category ON amenities(category_id);

-- Backfill category_id from amenity_type_id mapping
UPDATE amenities SET category_id = (
    CASE
        WHEN amenity_type_id IN (SELECT id FROM amenity_types WHERE name ILIKE '%cà phê%' OR name ILIKE '%cafe%') THEN (SELECT id FROM amenity_categories WHERE slug = 'cafe')
        WHEN amenity_type_id IN (SELECT id FROM amenity_types WHERE name ILIKE '%nhà hàng%') THEN (SELECT id FROM amenity_categories WHERE slug = 'restaurant')
        WHEN amenity_type_id IN (SELECT id FROM amenity_types WHERE name ILIKE '%siêu thị%' OR name ILIKE '%trung tâm thương mại%' OR name ILIKE '%cửa hàng%') THEN (SELECT id FROM amenity_categories WHERE slug = 'shopping')
        WHEN amenity_type_id IN (SELECT id FROM amenity_types WHERE name ILIKE '%khách sạn%') THEN (SELECT id FROM amenity_categories WHERE slug = 'hotel')
        WHEN amenity_type_id IN (SELECT id FROM amenity_types WHERE name ILIKE '%trạm xe buýt%') THEN (SELECT id FROM amenity_categories WHERE slug = 'bus-stop')
        ELSE (SELECT id FROM amenity_categories WHERE slug = 'service')
    END
) WHERE category_id IS NULL;


-- 4. Create bus_stop_cache table
CREATE TABLE IF NOT EXISTS bus_stop_cache (
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

CREATE INDEX IF NOT EXISTS idx_bus_stop_cache_geo ON bus_stop_cache(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_bus_stop_cache_station ON bus_stop_cache(station_id);


-- 5. Seed sample amenities with lat/lng for map display
-- (Only insert if amenities table is empty or has no lat/lng data)
DELETE FROM amenities WHERE slug IN ('the-coffee-house-ben-thanh', 'nha-hang-ngon-ben-thanh', 'vincom-center-ben-thanh', 'new-world-saigon-hotel', 'starbucks-vinhomes-ba-son', 'park-hyatt-saigon', 'hoang-yen-cuisine-thao-dien', 'vincom-mega-mall-thao-dien', 'highlands-coffee-thu-duc', 'gigamall-thu-duc');
INSERT INTO amenities (id, station_id, amenity_type_id, category_id, name, slug, distance_meters, address, latitude, longitude, image_url, opening_hours, description, rating, is_active)
VALUES
    -- Ga Bến Thành
    (uuid_generate_v4(), 1, 2, (SELECT id FROM amenity_categories WHERE slug='cafe'), 'The Coffee House Bến Thành', 'the-coffee-house-ben-thanh', 180, '86 Nam Kỳ Khởi Nghĩa, Q.1', 10.77350, 106.69600, 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800', 'T2-CN: 7:00-22:00', 'Quán cà phê phong cách hiện đại gần ga Bến Thành', 4.5, true),
    (uuid_generate_v4(), 1, 1, (SELECT id FROM amenity_categories WHERE slug='restaurant'), 'Nhà hàng Ngon', 'nha-hang-ngon-ben-thanh', 350, '160 Pasteur, Q.1', 10.77400, 106.69500, 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800', 'T2-CN: 10:00-22:00', 'Nhà hàng ẩm thực Việt nổi tiếng', 4.6, true),
    (uuid_generate_v4(), 1, 4, (SELECT id FROM amenity_categories WHERE slug='shopping'), 'Vincom Center Bến Thành', 'vincom-center-ben-thanh', 400, '72 Lê Thánh Tôn, Q.1', 10.77150, 106.69900, 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800', 'T2-CN: 9:30-22:00', 'Trung tâm thương mại cao cấp', 4.4, true),
    (uuid_generate_v4(), 1, 6, (SELECT id FROM amenity_categories WHERE slug='hotel'), 'New World Saigon Hotel', 'new-world-saigon-hotel', 250, '76 Lê Lai, Q.1', 10.76950, 106.69400, 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', '24/7', 'Khách sạn 5 sao gần ga Bến Thành', 4.8, true),

    -- Ga Ba Son
    (uuid_generate_v4(), 3, 2, (SELECT id FROM amenity_categories WHERE slug='cafe'), 'Starbucks Vinhomes Ba Son', 'starbucks-vinhomes-ba-son', 120, 'Vinhomes Golden River, Q.1', 10.78800, 106.70600, 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800', 'T2-CN: 7:00-22:00', 'Starbucks tại khu đô thị Vinhomes Ba Son', 4.3, true),
    (uuid_generate_v4(), 3, 6, (SELECT id FROM amenity_categories WHERE slug='hotel'), 'Park Hyatt Saigon', 'park-hyatt-saigon', 200, '2 Công Trường Lam Sơn, Q.1', 10.77700, 106.70400, 'https://images.unsplash.com/photo-1551882547-ff40c63fe2e4?w=800', '24/7', 'Khách sạn 5 sao hàng đầu Sài Gòn', 4.9, true),

    -- Ga Thảo Điền
    (uuid_generate_v4(), 6, 1, (SELECT id FROM amenity_categories WHERE slug='restaurant'), 'Hoàng Yến Cuisine', 'hoang-yen-cuisine-thao-dien', 300, '7 Nguyễn Thị Minh Khai, TP. Thủ Đức', 10.81150, 106.73800, 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800', 'T2-CN: 10:00-22:00', 'Nhà hàng ẩm thực Việt cao cấp', 4.5, true),
    (uuid_generate_v4(), 6, 4, (SELECT id FROM amenity_categories WHERE slug='shopping'), 'Vincom Mega Mall Thảo Điền', 'vincom-mega-mall-thao-dien', 450, '159 Xa Lộ Hà Nội, TP. Thủ Đức', 10.80800, 106.73500, 'https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?w=800', 'T2-CN: 9:30-22:00', 'Trung tâm thương mại lớn nhất khu vực', 4.2, true),

    -- Ga Thủ Đức
    (uuid_generate_v4(), 11, 2, (SELECT id FROM amenity_categories WHERE slug='cafe'), 'Highlands Coffee Thủ Đức', 'highlands-coffee-thu-duc', 160, '101 Võ Văn Ngân, TP. Thủ Đức', 10.85250, 106.79600, 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800', 'T2-CN: 7:00-22:30', 'Quán cà phê Highlands gần ga Thủ Đức', 4.4, true),

    -- Ga Suối Tiên
    (uuid_generate_v4(), 14, 4, (SELECT id FROM amenity_categories WHERE slug='shopping'), 'Gigamall Thủ Đức', 'gigamall-thu-duc', 600, '240 Phạm Văn Đồng, TP. Thủ Đức', 10.87600, 106.80800, 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=800', 'T2-CN: 9:00-22:00', 'Trung tâm thương mại hiện đại', 4.5, true);


-- 6. Seed bus stop cache data near Line 1 stations
INSERT INTO bus_stop_cache (name, code, latitude, longitude, address, routes, station_id, distance_to_station)
VALUES
    ('Trạm Nhà hát TP - Đồng Khởi', 'BS003', 10.77800, 106.70200, 'Đồng Khởi, Q.1', ARRAY['01','03'], 2, 150),
    ('Trạm Ba Son - Tôn Đức Thắng', 'BS004', 10.78600, 106.70500, 'Tôn Đức Thắng, Q.1', ARRAY['01'], 3, 180),
    ('Trạm Văn Thánh - Điện Biên Phủ', 'BS005', 10.79700, 106.71500, 'Điện Biên Phủ, Bình Thạnh', ARRAY['04','53'], 4, 250),
    ('Trạm Tân Cảng - Xa Lộ Hà Nội', 'BS006', 10.80300, 106.72200, 'Xa Lộ Hà Nội, Bình Thạnh', ARRAY['01','36'], 5, 300),
    ('Trạm Thảo Điền - Quốc Hương', 'BS007', 10.81200, 106.73600, 'Quốc Hương, TP. Thủ Đức', ARRAY['02','36'], 6, 200),
    ('Trạm An Phú - Lương Định Của', 'BS008', 10.81700, 106.74900, 'Lương Định Của, TP. Thủ Đức', ARRAY['03','53'], 7, 250),
    ('Trạm Rạch Chiếc - Mai Chí Thọ', 'BS009', 10.82800, 106.76500, 'Mai Chí Thọ, TP. Thủ Đức', ARRAY['01','04'], 8, 300),
    ('Trạm Thủ Đức - Võ Văn Ngân', 'BS010', 10.85000, 106.79400, 'Võ Văn Ngân, TP. Thủ Đức', ARRAY['02','36','53'], 11, 200),
    ('Trạm ĐHQG - KP6 Linh Trung', 'BS011', 10.86700, 106.80200, 'KP6, Linh Trung, TP. Thủ Đức', ARRAY['04'], 13, 250),
    ('Trạm Suối Tiên - Xa Lộ HN', 'BS012', 10.87300, 106.80500, 'Xa Lộ Hà Nội, TP. Thủ Đức', ARRAY['01','02','53'], 14, 350)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address;


-- 7. Align stations exactly on the new geographical trace
UPDATE stations SET latitude = 10.7707525, longitude = 106.6976235 WHERE code = 'BT';
UPDATE stations SET latitude = 10.7763099, longitude = 106.7032012 WHERE code = 'NHTP';
UPDATE stations SET latitude = 10.7854683, longitude = 106.7116613 WHERE code = 'BS';
UPDATE stations SET latitude = 10.7954005, longitude = 106.7146351 WHERE code = 'VT';
UPDATE stations SET latitude = 10.7988451, longitude = 106.7247763 WHERE code = 'TC';
UPDATE stations SET latitude = 10.8011719, longitude = 106.7371744 WHERE code = 'TD';
UPDATE stations SET latitude = 10.8028319, longitude = 106.7457001 WHERE code = 'AP';
UPDATE stations SET latitude = 10.8245436, longitude = 106.7593225 WHERE code = 'RC';
UPDATE stations SET latitude = 10.8321408, longitude = 106.7635847 WHERE code = 'PL';
UPDATE stations SET latitude = 10.8469651, longitude = 106.7719468 WHERE code = 'BThai';
UPDATE stations SET latitude = 10.8511216, longitude = 106.7755480 WHERE code = 'TDu';
UPDATE stations SET latitude = 10.8587590, longitude = 106.7883825 WHERE code = 'KCNC';
UPDATE stations SET latitude = 10.8660601, longitude = 106.8007582 WHERE code = 'DHQG';
UPDATE stations SET latitude = 10.8754446, longitude = 106.8099432 WHERE code = 'ST';

-- ============================================================
-- END OF MIGRATION
-- ============================================================
