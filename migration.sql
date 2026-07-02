ALTER TABLE events ADD COLUMN is_promo BOOLEAN DEFAULT 0;
ALTER TABLE events ADD COLUMN allow_days INTEGER DEFAULT 30;
ALTER TABLE events ADD COLUMN announcement_text TEXT;

ALTER TABLE devices ADD COLUMN has_used_promo BOOLEAN DEFAULT 0;

CREATE TABLE announcements_new (
    key TEXT PRIMARY KEY CHECK(key IN ('normal', 'expire', 'renew', 'limit_device', 'limit_os', 'wrong_hwid', 'miss_hwid', 'no_more_free', 'promo_used')),
    message TEXT NOT NULL
);
INSERT INTO announcements_new SELECT * FROM announcements;
INSERT INTO announcements_new (key, message) VALUES ('promo_used', 'Promo already claimed');
DROP TABLE announcements;
ALTER TABLE announcements_new RENAME TO announcements;
