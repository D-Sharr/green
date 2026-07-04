CREATE TABLE IF NOT EXISTS warp_configs (
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

CREATE TABLE IF NOT EXISTS warp_settings (
    id           INTEGER PRIMARY KEY CHECK(id = 1),
    auto_connect INTEGER DEFAULT 0,
    endpoint     TEXT,
    remark       TEXT
);

INSERT OR IGNORE INTO warp_settings (id, auto_connect, endpoint, remark) VALUES (1, 0, '', '');
