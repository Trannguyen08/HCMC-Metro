-- Add usage_remaining column for single ticket trip counting
ALTER TABLE tickets
ADD COLUMN IF NOT EXISTS usage_remaining INT;

-- Initialize existing data:
-- single ticket defaults to 1 remaining usage if null
UPDATE tickets t
SET usage_remaining = 1
FROM ticket_types tt
WHERE t.ticket_type_id = tt.id
  AND tt.type = 'single'
  AND t.usage_remaining IS NULL;

-- non-single ticket unlimited usage represented by NULL
UPDATE tickets t
SET usage_remaining = NULL
FROM ticket_types tt
WHERE t.ticket_type_id = tt.id
  AND tt.type <> 'single';
