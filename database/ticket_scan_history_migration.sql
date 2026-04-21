CREATE TABLE IF NOT EXISTS ticket_scan_histories (
    id BIGSERIAL PRIMARY KEY,
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    scanned_by UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    scan_date DATE NOT NULL,
    status_before VARCHAR(30),
    status_after VARCHAR(30),
    usage_remaining_before INT,
    usage_remaining_after INT,
    success BOOLEAN NOT NULL DEFAULT FALSE,
    message TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ticket_scan_histories_ticket_id
    ON ticket_scan_histories(ticket_id);

CREATE INDEX IF NOT EXISTS idx_ticket_scan_histories_scanned_at
    ON ticket_scan_histories(scanned_at DESC);

CREATE INDEX IF NOT EXISTS idx_ticket_scan_histories_scan_date
    ON ticket_scan_histories(scan_date);
