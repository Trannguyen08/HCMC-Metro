-- ============================================================
-- MIGRATION: ADD ENGLISH COLUMNS FOR DUAL-LANGUAGE SUPPORT
-- ============================================================

-- 1. NEWS
ALTER TABLE news_categories ADD COLUMN name_en VARCHAR(100);
UPDATE news_categories SET name_en = 'Notice' WHERE name = 'Thông báo';
UPDATE news_categories SET name_en = 'Event' WHERE name = 'Sự kiện';
UPDATE news_categories SET name_en = 'Promotion' WHERE name = 'Khuyến mãi';
UPDATE news_categories SET name_en = 'Guide' WHERE name = 'Hướng dẫn';

ALTER TABLE news ADD COLUMN title_en VARCHAR(500), ADD COLUMN summary_en TEXT;

-- 2. METRO LINES & STATIONS
ALTER TABLE metro_lines ADD COLUMN name_en VARCHAR(100), ADD COLUMN description_en TEXT;
UPDATE metro_lines SET name_en = 'Line 1 - Ben Thanh – Suoi Tien', description_en = 'The first metro line in Ho Chi Minh City' WHERE code = 'L1';
UPDATE metro_lines SET name_en = 'Line 2 - Ben Thanh – Tham Luong', description_en = 'Metro line 2' WHERE code = 'L2';

ALTER TABLE stations ADD COLUMN name_en VARCHAR(255), ADD COLUMN address_en VARCHAR(500), ADD COLUMN description_en TEXT;
UPDATE stations SET name_en = 'Ben Thanh', address_en = 'District 1, HCMC' WHERE code = 'BT';
UPDATE stations SET name_en = 'City Theater', address_en = 'District 1, HCMC' WHERE code = 'NHTP';
UPDATE stations SET name_en = 'Ba Son', address_en = 'District 1, HCMC' WHERE code = 'BS';
UPDATE stations SET name_en = 'Van Thanh', address_en = 'Binh Thanh District, HCMC' WHERE code = 'VT';
UPDATE stations SET name_en = 'Tan Cang', address_en = 'Binh Thanh District, HCMC' WHERE code = 'TC';
UPDATE stations SET name_en = 'Thao Dien', address_en = 'District 2, HCMC' WHERE code = 'TD';
UPDATE stations SET name_en = 'An Phu', address_en = 'District 2, HCMC' WHERE code = 'AP';
UPDATE stations SET name_en = 'Rach Chiec', address_en = 'District 9, HCMC' WHERE code = 'RC';
UPDATE stations SET name_en = 'Phuoc Long', address_en = 'District 9, HCMC' WHERE code = 'PL';
UPDATE stations SET name_en = 'Binh Thai', address_en = 'District 9, HCMC' WHERE code = 'BThai';
UPDATE stations SET name_en = 'Thu Duc', address_en = 'Thu Duc City, HCMC' WHERE code = 'TDu';
UPDATE stations SET name_en = 'Hi-Tech Park', address_en = 'Thu Duc City, HCMC' WHERE code = 'KCNC';
UPDATE stations SET name_en = 'National University', address_en = 'Thu Duc City, HCMC' WHERE code = 'DHQG';
UPDATE stations SET name_en = 'Suoi Tien', address_en = 'Thu Duc City, HCMC' WHERE code = 'ST';

-- IF addresses share the same pattern, we can run general replace (optional, doing exact matches for seeded).
UPDATE stations SET name_en = name WHERE name_en IS NULL;

-- 3. TICKETS
ALTER TABLE ticket_types ADD COLUMN name_en VARCHAR(100), ADD COLUMN description_en TEXT;
UPDATE ticket_types SET name_en = 'Single Ticket' WHERE type = 'single';
UPDATE ticket_types SET name_en = 'Day Pass' WHERE type = 'single_day';
UPDATE ticket_types SET name_en = '3-Day Pass' WHERE type = 'three_day';
UPDATE ticket_types SET name_en = 'Weekly Pass' WHERE type = 'weekly';
UPDATE ticket_types SET name_en = 'Monthly Pass' WHERE type = 'monthly';

-- 4. AMENITIES
ALTER TABLE amenity_categories ADD COLUMN name_en VARCHAR(100);
ALTER TABLE amenity_types ADD COLUMN name_en VARCHAR(100);

UPDATE amenity_types SET name_en = 'Restaurant' WHERE name = 'Nhà hàng';
UPDATE amenity_types SET name_en = 'Coffee / Cafe' WHERE name = 'Cà phê';
UPDATE amenity_types SET name_en = 'ATM / Bank' WHERE name = 'ATM / Ngân hàng';
UPDATE amenity_types SET name_en = 'Supermarket / Convenience Store' WHERE name = 'Siêu thị / Cửa hàng tiện lợi';
UPDATE amenity_types SET name_en = 'Hospital / Clinic' WHERE name = 'Bệnh viện / Phòng khám';
UPDATE amenity_types SET name_en = 'Hotel' WHERE name = 'Khách sạn';
UPDATE amenity_types SET name_en = 'Parking Lot' WHERE name = 'Bãi giữ xe';
UPDATE amenity_types SET name_en = 'Bus Stop' WHERE name = 'Trạm xe buýt';
UPDATE amenity_types SET name_en = 'Shopping Mall' WHERE name = 'Trung tâm thương mại';
UPDATE amenity_types SET name_en = 'Park' WHERE name = 'Công viên';

ALTER TABLE amenities ADD COLUMN name_en VARCHAR(255), ADD COLUMN address_en VARCHAR(500), ADD COLUMN opening_hours_en VARCHAR(255), ADD COLUMN description_en TEXT;
