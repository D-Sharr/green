DROP TABLE IF EXISTS devices;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS announcements;
DROP TABLE IF EXISTS links;
DROP TABLE IF EXISTS configs;
DROP TABLE IF EXISTS proxies;
DROP TABLE IF EXISTS warp_configs;
DROP TABLE IF EXISTS warp_settings;

CREATE TABLE configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    node TEXT NOT NULL,
    position INTEGER DEFAULT 0
);

CREATE TABLE links (
    id TEXT PRIMARY KEY, -- UUID
    remark TEXT,
    custom_parameters TEXT,
    combined_configs TEXT
);

CREATE TABLE events (
    id TEXT PRIMARY KEY, -- UUID
    name TEXT NOT NULL,
    event_type TEXT CHECK(event_type IN ('limited', 'hwid')) NOT NULL,
    remark TEXT,
    link_id TEXT NOT NULL,
    allowed_user INTEGER DEFAULT 0,
    joined_users INTEGER DEFAULT 0,
    user_type TEXT CHECK(user_type IN ('free', 'paid', 'promo')) NOT NULL,
    allowed_os TEXT CHECK(allowed_os IN ('all', 'Android', 'iOS', 'Mac', 'Windows')) NOT NULL,
    start_date DATETIME,
    end_date DATETIME,
    event_code TEXT NOT NULL,
    happ_link TEXT,
    is_promo BOOLEAN DEFAULT 0,
    allow_days INTEGER DEFAULT 30,
    FOREIGN KEY (link_id) REFERENCES links(id) ON DELETE CASCADE
);

CREATE TABLE announcements (
    key TEXT CHECK(key IN ('normal', 'expire', 'renew', 'limit_device', 'limit_os', 'wrong_hwid', 'miss_hwid', 'no_more_free', 'promo_used')),
    target_event_id TEXT DEFAULT 'global',
    message TEXT NOT NULL,
    PRIMARY KEY (key, target_event_id)
);

CREATE TABLE devices (
    hwid TEXT PRIMARY KEY,
    device_info_os TEXT,
    link_id TEXT,
    event_id TEXT,
    current_event_id TEXT,
    first_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    expire_date DATETIME,
    user_type TEXT CHECK(user_type IN ('free', 'paid', 'promo', 'reg')) NOT NULL,
    has_used_promo BOOLEAN DEFAULT 0,
    FOREIGN KEY (link_id) REFERENCES links(id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL,
    FOREIGN KEY (current_event_id) REFERENCES events(id) ON DELETE SET NULL
);

CREATE TABLE proxies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE warp_configs (
    hwid         TEXT PRIMARY KEY,
    config_id    TEXT,
    private_key  TEXT,
    public_key   TEXT,
    endpoint     TEXT,
    address_v4   TEXT,
    address_v6   TEXT,
    reserved     TEXT,
    mtu          INTEGER DEFAULT 1280,
    remark       TEXT,
    warp_uri     TEXT NOT NULL,
    auto_mode    INTEGER DEFAULT 0,
    status       TEXT DEFAULT 'active',
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (hwid) REFERENCES devices(hwid) ON DELETE CASCADE
);

CREATE TABLE warp_settings (
    id           INTEGER PRIMARY KEY CHECK(id = 1),
    auto_connect INTEGER DEFAULT 0,
    endpoint     TEXT,
    remark       TEXT
);

INSERT INTO warp_settings (id, auto_connect, endpoint, remark) VALUES (1, 0, '', '');
