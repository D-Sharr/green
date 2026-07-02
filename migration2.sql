ALTER TABLE events DROP COLUMN announcement_text;

CREATE TABLE announcements_new (
    key TEXT CHECK(key IN ('normal', 'expire', 'renew', 'limit_device', 'limit_os', 'wrong_hwid', 'miss_hwid', 'no_more_free', 'promo_used')),
    target_event_id TEXT DEFAULT 'global',
    message TEXT NOT NULL,
    PRIMARY KEY (key, target_event_id)
);
INSERT INTO announcements_new (key, message) SELECT key, message FROM announcements;
DROP TABLE announcements;
ALTER TABLE announcements_new RENAME TO announcements;
