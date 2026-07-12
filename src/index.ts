import { Hono } from "hono";
import { bearerAuth } from "hono/bearer-auth";
import { adminHtmlTemplate } from "./admin-ui";
import { landingHtmlTemplate } from "./landing-ui";
import { postcardHtmlTemplate } from "./postcard-ui";


export type Bindings = {
  DB: D1Database;
  ADMIN_TOKEN: string;
  EVENT_SECRET: string;
  EXTERNAL_API_TOKEN: string;
  VERCEL_WARP_URL: string;
  VERCEL_WARP_TOKEN: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: `Application Error: ${err.message || err.toString()}` }, 500);
});

// Landing page — weather-app style UI
app.get("/", (c) => c.html(landingHtmlTemplate));



// Serve Frontend Admin UI
app.get("/dev", (c) => c.html(adminHtmlTemplate));

// --- Middleware ---
// Apply Bearer Auth to all /api/dev/* routes
app.use("/api/dev/*", async (c, next) => {
  const token = c.env.ADMIN_TOKEN || "default-secret-token"; // Please define ADMIN_TOKEN in wrangler.toml or secrets
  const auth = bearerAuth({ token });
  return auth(c, next);
});

// --- ADMIN API ROUTES ---

// ==========================================
// PROXIES CRUD
// ==========================================

// Get all proxies
app.get("/api/dev/proxies", async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM proxies").all();
  return c.json(results);
});

// Get active proxies
app.get("/api/dev/proxies/active", async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM proxies WHERE is_active = 1").all();
  return c.json(results);
});

// Create proxy
app.post("/api/dev/proxies", async (c) => {
  const { name, url, is_active } = await c.req.json();
  if (!name || !url) return c.json({ error: "Missing name or url" }, 400);

  // Strip trailing slash
  const cleanUrl = url.replace(/\/+$/, '');
  const activeVal = is_active !== undefined ? (is_active ? 1 : 0) : 1;

  const { success } = await c.env.DB.prepare(
    "INSERT INTO proxies (name, url, is_active) VALUES (?, ?, ?)"
  ).bind(name, cleanUrl, activeVal).run();

  if (success) return c.json({ message: "Proxy created" }, 201);
  return c.json({ error: "Failed to create proxy" }, 500);
});

// Update proxy
app.put("/api/dev/proxies/:id", async (c) => {
  const id = c.req.param("id");
  const { name, url, is_active } = await c.req.json();

  if (!name || !url) return c.json({ error: "Missing name or url" }, 400);
  const cleanUrl = url.replace(/\/+$/, '');
  const activeVal = is_active ? 1 : 0;

  const { success } = await c.env.DB.prepare(
    "UPDATE proxies SET name = ?, url = ?, is_active = ? WHERE id = ?"
  ).bind(name, cleanUrl, activeVal, id).run();

  if (success) return c.json({ message: "Proxy updated" });
  return c.json({ error: "Failed to update proxy" }, 500);
});

// Delete proxy
app.delete("/api/dev/proxies/:id", async (c) => {
  const id = c.req.param("id");
  const { success } = await c.env.DB.prepare("DELETE FROM proxies WHERE id = ?").bind(id).run();

  if (success) return c.json({ message: "Proxy deleted" });
  return c.json({ error: "Failed to delete proxy" }, 500);
});

// ==========================================
// CONFIGS CRUD
// ==========================================

// Get all configs
app.get("/api/dev/configs", async (c) => {
  try {
    const { results } = await c.env.DB.prepare("SELECT * FROM configs ORDER BY position ASC, id ASC").all();
    return c.json(results);
  } catch (err: any) {
    if (err.message && (err.message.includes("no such column") || err.message.includes("position"))) {
      try {
        await c.env.DB.prepare("ALTER TABLE configs ADD COLUMN position INTEGER DEFAULT 0").run();
        const { results } = await c.env.DB.prepare("SELECT * FROM configs ORDER BY position ASC, id ASC").all();
        return c.json(results);
      } catch (alterErr) {
        console.error("Failed to dynamically add position column:", alterErr);
      }
    }
    // Fallback if anything else goes wrong
    const { results } = await c.env.DB.prepare("SELECT * FROM configs ORDER BY id ASC").all();
    return c.json(results);
  }
});

// Get single config
app.get("/api/dev/configs/:id", async (c) => {
  const id = c.req.param("id");
  const config = await c.env.DB.prepare("SELECT * FROM configs WHERE id = ?").bind(id).first();
  if (!config) return c.json({ error: "Not found" }, 404);
  return c.json(config);
});

// Reorder configs [NEW]
app.put("/api/dev/configs/reorder", async (c) => {
  const { ids } = await c.req.json<{ ids: number[] }>();
  if (!ids || !Array.isArray(ids)) {
    return c.json({ error: "Invalid payload" }, 400);
  }

  // Ensure column exists first
  try {
    const stmts = ids.map((id, index) => {
      return c.env.DB.prepare("UPDATE configs SET position = ? WHERE id = ?").bind(index, id);
    });
    await c.env.DB.batch(stmts);
    return c.json({ message: "Positions reordered successfully" });
  } catch (err: any) {
    if (err.message && (err.message.includes("no such column") || err.message.includes("position"))) {
      try {
        await c.env.DB.prepare("ALTER TABLE configs ADD COLUMN position INTEGER DEFAULT 0").run();
        const stmts = ids.map((id, index) => {
          return c.env.DB.prepare("UPDATE configs SET position = ? WHERE id = ?").bind(index, id);
        });
        await c.env.DB.batch(stmts);
        return c.json({ message: "Positions reordered successfully" });
      } catch (alterErr) {}
    }
    return c.json({ error: `Failed to reorder configs: ${err.message}` }, 500);
  }
});

// Create config
app.post("/api/dev/configs", async (c) => {
  const { name, node } = await c.req.json();

  if (!name || !node) return c.json({ error: "Missing name or node" }, 400);

  try {
    const maxPosRow = await c.env.DB.prepare("SELECT MAX(position) as maxPos FROM configs").first<{ maxPos: number | null }>();
    const nextPos = (maxPosRow?.maxPos || 0) + 1;

    const { success } = await c.env.DB.prepare(
      "INSERT INTO configs (name, node, position) VALUES (?, ?, ?)"
    ).bind(name, node, nextPos).run();

    if (success) {
      return c.json({ message: "Config created" }, 201);
    }
  } catch (err: any) {
    if (err.message && (err.message.includes("no such column") || err.message.includes("position") || err.message.includes("has no column"))) {
      try {
        await c.env.DB.prepare("ALTER TABLE configs ADD COLUMN position INTEGER DEFAULT 0").run();
        const { success } = await c.env.DB.prepare(
          "INSERT INTO configs (name, node, position) VALUES (?, ?, ?)"
        ).bind(name, node, 1).run();
        if (success) {
          return c.json({ message: "Config created" }, 201);
        }
      } catch (alterErr) {}
    }
    // Final fallback
    const { success } = await c.env.DB.prepare(
      "INSERT INTO configs (name, node) VALUES (?, ?)"
    ).bind(name, node).run();
    if (success) {
      return c.json({ message: "Config created (fallback)" }, 201);
    }
  }
  return c.json({ error: "Failed to create config" }, 500);
});

// Update config
app.put("/api/dev/configs/:id", async (c) => {
  const id = c.req.param("id");
  const { name, node } = await c.req.json();

  const { success } = await c.env.DB.prepare(
    "UPDATE configs SET name = ?, node = ? WHERE id = ?"
  ).bind(name, node, id).run();

  if (success) {
    return c.json({ message: "Config updated" });
  }
  return c.json({ error: "Failed to update config" }, 500);
});

// Delete config
app.delete("/api/dev/configs/:id", async (c) => {
  const id = c.req.param("id");
  const { success } = await c.env.DB.prepare("DELETE FROM configs WHERE id = ?").bind(id).run();

  if (success) {
    return c.json({ message: "Config deleted" });
  }
  return c.json({ error: "Failed to delete config" }, 500);
});

// ==========================================
// LINKS CRUD
// ==========================================

// Get all links
app.get("/api/dev/links", async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM links").all();
  return c.json(results);
});

// Create link
app.post("/api/dev/links", async (c) => {
  const { id, remark, custom_parameters, combined_configs } = await c.req.json();

  if (!id) return c.json({ error: "Missing required tracking UUID" }, 400);

  const { success } = await c.env.DB.prepare(
    "INSERT INTO links (id, remark, custom_parameters, combined_configs) VALUES (?, ?, ?, ?)"
  ).bind(id, remark || null, custom_parameters || null, combined_configs || null).run();

  if (success) {
    return c.json({ message: "Link created", id }, 201);
  }
  return c.json({ error: "Failed to create link" }, 500);
});

// Update link
app.put("/api/dev/links/:id", async (c) => {
  const linkId = c.req.param("id");
  const { remark, custom_parameters, combined_configs } = await c.req.json();

  const { success } = await c.env.DB.prepare(
    "UPDATE links SET remark = ?, custom_parameters = ?, combined_configs = ? WHERE id = ?"
  ).bind(remark || null, custom_parameters || null, combined_configs || null, linkId).run();

  if (success) {
    return c.json({ message: "Link updated" });
  }
  return c.json({ error: "Failed to update link" }, 500);
});

// Delete link
app.delete("/api/dev/links/:id", async (c) => {
  const id = c.req.param("id");
  const { success } = await c.env.DB.prepare("DELETE FROM links WHERE id = ?").bind(id).run();

  if (success) {
    return c.json({ message: "Link deleted" });
  }
  return c.json({ error: "Failed to delete link" }, 500);
});

// ==========================================
// EVENTS CRUD
// ==========================================

// Get all events
app.get("/api/dev/events", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT e.*, (SELECT COUNT(*) FROM devices d WHERE d.current_event_id = e.id) AS joined_users FROM events e"
  ).all();
  return c.json(results);
});

// Create event
app.post("/api/dev/events", async (c) => {
  const { id, name, event_type, remark, link_id, allowed_user, user_type, allowed_os, start_date, end_date, is_promo, allow_days } = await c.req.json();

  if (!id || !name || !event_type || !link_id || !user_type || !allowed_os) {
    return c.json({ error: "Missing required fields" }, 400);
  }

  // Generate short secure token (12 chars hex)
  const event_code = Array.from(crypto.getRandomValues(new Uint8Array(6)))
    .map(b => b.toString(16).padStart(2, '0')).join('');

  const num_allowed = Number(allowed_user) || 0;

  const { success } = await c.env.DB.prepare(
    "INSERT INTO events (id, name, event_type, remark, link_id, allowed_user, user_type, allowed_os, start_date, end_date, event_code, happ_link, is_promo, allow_days) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).bind(id, name, event_type, remark || null, link_id, num_allowed, user_type, allowed_os, start_date || null, end_date || null, event_code, null, is_promo ? 1 : 0, Number(allow_days) || 30).run();

  if (!success) {
    return c.json({ error: "Failed to create event" }, 500);
  }

  // Generate Happ encrypted link (non-blocking — failure won't crash event creation)
  let happ_link = null;
  try {
    const origin = new URL(c.req.url).origin;
    const event_link = `${origin}/sub/${link_id}?event_code=${event_code}`;

    const cryptoResponse = await fetch('https://crypto.happ.su/api-v2.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: event_link })
    });

    if (cryptoResponse.ok) {
      const data = await cryptoResponse.json() as { encrypted_link?: string };
      if (data.encrypted_link) {
        happ_link = data.encrypted_link;
        await c.env.DB.prepare("UPDATE events SET happ_link = ? WHERE id = ?").bind(happ_link, id).run();
      }
    }
  } catch (err) {
    console.error("Happ crypto API error (non-fatal):", err);
  }

  return c.json({ message: "Event created", id, event_code, happ_link }, 201);
});

// Update event
app.put("/api/dev/events/:id", async (c) => {
  const id = c.req.param("id");
  const { name, event_type, remark, link_id, allowed_user, user_type, allowed_os, start_date, end_date, is_promo, allow_days } = await c.req.json();

  if (!name || !event_type || !link_id || !user_type || !allowed_os) {
    return c.json({ error: "Missing required fields" }, 400);
  }
  const num_allowed = Number(allowed_user) || 0;

  const { success } = await c.env.DB.prepare(
    "UPDATE events SET name = ?, event_type = ?, remark = ?, link_id = ?, allowed_user = ?, user_type = ?, allowed_os = ?, start_date = ?, end_date = ?, is_promo = ?, allow_days = ? WHERE id = ?"
  ).bind(name, event_type, remark || null, link_id, num_allowed, user_type, allowed_os, start_date || null, end_date || null, is_promo ? 1 : 0, Number(allow_days) || 30, id).run();

  if (!success) {
    return c.json({ error: "Failed to update event" }, 500);
  }

  // Regenerate Happ encrypted link on update
  let happ_link = null;
  try {
    const ev = await c.env.DB.prepare("SELECT event_code FROM events WHERE id = ?").bind(id).first<{ event_code: string }>();
    if (ev) {
      const origin = new URL(c.req.url).origin;
      const event_link = `${origin}/sub/${link_id}?event_code=${ev.event_code}`;

      const cryptoResponse = await fetch('https://crypto.happ.su/api-v2.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: event_link })
      });

      if (cryptoResponse.ok) {
        const data = await cryptoResponse.json() as { encrypted_link?: string };
        if (data.encrypted_link) {
          happ_link = data.encrypted_link;
          await c.env.DB.prepare("UPDATE events SET happ_link = ? WHERE id = ?").bind(happ_link, id).run();
        }
      }
    }
  } catch (err) {
    console.error("Happ crypto API error on update (non-fatal):", err);
  }

  return c.json({ message: "Event updated", happ_link });
});

// Delete event
app.delete("/api/dev/events/:id", async (c) => {
  const id = c.req.param("id");
  const { success } = await c.env.DB.prepare("DELETE FROM events WHERE id = ?").bind(id).run();

  if (success) {
    return c.json({ message: "Event deleted" });
  }
  return c.json({ error: "Failed to delete event" }, 500);
});

// ==========================================
// ANNOUNCEMENTS CRUD
// ==========================================

// Get all announcements
app.get("/api/dev/announcements", async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM announcements").all();
  return c.json(results);
});

// Update announcements for a target
app.put("/api/dev/announcements", async (c) => {
  const body = await c.req.json();
  const target = body.target_event_id || 'global';
  const keys = ['normal', 'expire', 'renew', 'limit_device', 'limit_os', 'wrong_hwid', 'miss_hwid', 'no_more_free', 'promo_used'];

  const stmts = keys.map(key => {
    const val = body[key] || "";
    return c.env.DB.prepare(
      "INSERT INTO announcements (key, target_event_id, message) VALUES (?, ?, ?) ON CONFLICT(key, target_event_id) DO UPDATE SET message = excluded.message"
    ).bind(key, target, val);
  });

  try {
    await c.env.DB.batch(stmts);
    return c.json({ message: "Announcements updated" });
  } catch (err) {
    return c.json({ error: "Failed to update announcements" }, 500);
  }
});

// Delete announcements for an event
app.delete("/api/dev/announcements/:target", async (c) => {
  const target = c.req.param("target");
  if (target === 'global') return c.json({ error: "Cannot delete global announcements" }, 400);
  await c.env.DB.prepare("DELETE FROM announcements WHERE target_event_id = ?").bind(target).run();
  return c.json({ message: "Announcement set deleted" });
});

// ==========================================
// DEVICES CRUD
// ==========================================

// Get all devices
app.get("/api/dev/devices", async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM devices").all();
  return c.json(results);
});

// Create device
app.post("/api/dev/devices", async (c) => {
  const { hwid, device_info_os } = await c.req.json();

  if (!hwid) return c.json({ error: "Missing required field (hwid)" }, 400);

  const existingDevice = await c.env.DB.prepare(
    "SELECT user_type, (SELECT name FROM events WHERE events.id = devices.current_event_id) as event_name FROM devices WHERE hwid = ?"
  ).bind(hwid).first<{ user_type: string, event_name: string }>();

  if (existingDevice) {
    const eventName = existingDevice.event_name || 'None';
    return c.json({ error: `Already registered! This device is currently marked as ${existingDevice.user_type} and joined to event: ${eventName}.` }, 409);
  }

  const { success } = await c.env.DB.prepare(
    "INSERT INTO devices (hwid, device_info_os, user_type) VALUES (?, ?, 'reg')"
  ).bind(hwid, device_info_os || null).run();

  if (success) {
    return c.json({ message: "Device pre-registered", hwid }, 201);
  }
  return c.json({ error: "Failed to create device" }, 500);
});

// Update device
app.put("/api/dev/devices/:hwid", async (c) => {
  const currentHwid = c.req.param("hwid");
  const { device_info_os, event_id, expire_date, user_type } = await c.req.json();

  let link_id = null;
  if (event_id) {
    const ev = await c.env.DB.prepare("SELECT link_id FROM events WHERE id = ?").bind(event_id).first<{ link_id: string }>();
    if (ev) link_id = ev.link_id;
  }

  const { success } = await c.env.DB.prepare(
    "UPDATE devices SET device_info_os = ?, event_id = ?, current_event_id = ?, link_id = ?, expire_date = ?, user_type = ? WHERE hwid = ?"
  ).bind(device_info_os || null, event_id || null, event_id || null, link_id, expire_date || null, user_type, currentHwid).run();

  if (success) {
    return c.json({ message: "Device updated" });
  }
  return c.json({ error: "Failed to update device" }, 500);
});

// Delete device
app.delete("/api/dev/devices/:hwid", async (c) => {
  const hwid = c.req.param("hwid");
  const { success } = await c.env.DB.prepare("DELETE FROM devices WHERE hwid = ?").bind(hwid).run();

  if (success) {
    return c.json({ message: "Device deleted" });
  }
  return c.json({ error: "Failed to delete device" }, 500);
});


// ==========================================
// WARP CONFIGS CRUD
// ==========================================

async function callVercelWarp(env: Bindings, endpoint?: string, remark?: string): Promise<any> {
  const url = env.VERCEL_WARP_URL;
  const token = env.VERCEL_WARP_TOKEN;
  if (!url || !token) {
    throw new Error("Vercel WARP function not configured (missing VERCEL_WARP_URL or VERCEL_WARP_TOKEN)");
  }

  const body: Record<string, string> = {};
  if (endpoint) body.endpoint = endpoint;
  if (remark) body.remark = remark;

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Vercel WARP error ${resp.status}: ${errText}`);
  }

  return resp.json();
}

function buildWarpUri(fields: {
  private_key: string; public_key: string; endpoint: string;
  address_v4: string; address_v6: string; reserved: string;
  mtu: number; remark: string;
}): string {
  const encPriv = encodeURIComponent(fields.private_key);
  const encPub = encodeURIComponent(fields.public_key);
  const reservedParts = (fields.reserved || "").split(", ");
  const reservedStr = reservedParts.join("%2C%20");
  const encV4 = encodeURIComponent(fields.address_v4);
  const encV6 = fields.address_v6 ? encodeURIComponent(fields.address_v6) : "";
  const addressParam = encV6 ? `${encV4}%2C%20${encV6}` : encV4;
  return `wireguard://${encPriv}@${fields.endpoint}?publickey=${encPub}&presharedkey=&reserved=${reservedStr}&address=${addressParam}&mtu=${fields.mtu}#${fields.remark || ""}`;
}

// Get all warp configs (joined with device info)
app.get("/api/dev/warp", async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT wc.*, d.device_info_os, d.user_type,
             (SELECT name FROM events WHERE events.id = d.current_event_id) as event_name
      FROM warp_configs wc
      LEFT JOIN devices d ON d.hwid = wc.hwid
      ORDER BY wc.created_at DESC
    `).all();
    return c.json(results);
  } catch (err: any) {
    if (err.message && err.message.includes("no such table")) {
      try {
        await c.env.DB.batch([
          c.env.DB.prepare(`CREATE TABLE IF NOT EXISTS warp_configs (
            hwid TEXT PRIMARY KEY, config_id TEXT, private_key TEXT, public_key TEXT,
            endpoint TEXT, address_v4 TEXT, address_v6 TEXT, reserved TEXT,
            mtu INTEGER DEFAULT 1280, remark TEXT, warp_uri TEXT NOT NULL,
            auto_mode INTEGER DEFAULT 0, status TEXT DEFAULT 'active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (hwid) REFERENCES devices(hwid) ON DELETE CASCADE
          )`),
          c.env.DB.prepare(`CREATE TABLE IF NOT EXISTS warp_settings (
            id INTEGER PRIMARY KEY CHECK(id = 1), auto_connect INTEGER DEFAULT 0,
            endpoint TEXT, remark TEXT
          )`),
          c.env.DB.prepare("INSERT OR IGNORE INTO warp_settings (id, auto_connect, endpoint, remark) VALUES (1, 0, '', '')"),
        ]);
        const { results } = await c.env.DB.prepare(`
          SELECT wc.*, d.device_info_os, d.user_type,
                 (SELECT name FROM events WHERE events.id = d.current_event_id) as event_name
          FROM warp_configs wc
          LEFT JOIN devices d ON d.hwid = wc.hwid
          ORDER BY wc.created_at DESC
        `).all();
        return c.json(results);
      } catch (alterErr: any) {
        return c.json({ error: `Failed to create warp tables: ${alterErr.message}` }, 500);
      }
    }
    return c.json({ error: err.message }, 500);
  }
});

// Get warp settings
app.get("/api/dev/warp/settings", async (c) => {
  try {
    const row = await c.env.DB.prepare("SELECT * FROM warp_settings WHERE id = 1").first();
    return c.json(row || { id: 1, auto_connect: 0, endpoint: "", remark: "" });
  } catch (err: any) {
    if (err.message && err.message.includes("no such table")) {
      try {
        await c.env.DB.batch([
          c.env.DB.prepare(`CREATE TABLE IF NOT EXISTS warp_settings (
            id INTEGER PRIMARY KEY CHECK(id = 1), auto_connect INTEGER DEFAULT 0,
            endpoint TEXT, remark TEXT
          )`),
          c.env.DB.prepare("INSERT OR IGNORE INTO warp_settings (id, auto_connect, endpoint, remark) VALUES (1, 0, '', '')"),
        ]);
        const row = await c.env.DB.prepare("SELECT * FROM warp_settings WHERE id = 1").first();
        return c.json(row || { id: 1, auto_connect: 0, endpoint: "", remark: "" });
      } catch (alterErr: any) {
        return c.json({ error: `Failed to create warp_settings: ${alterErr.message}` }, 500);
      }
    }
    return c.json({ error: err.message }, 500);
  }
});

// Update warp settings
app.put("/api/dev/warp/settings", async (c) => {
  const { auto_connect, endpoint, remark } = await c.req.json();
  try {
    const { success } = await c.env.DB.prepare(
      "UPDATE warp_settings SET auto_connect = ?, endpoint = ?, remark = ? WHERE id = 1"
    ).bind(auto_connect ? 1 : 0, endpoint || "", remark || "").run();
    if (!success) return c.json({ error: "Failed to update settings" }, 500);

    let propagated = 0;
    try {
      const { results: configs } = await c.env.DB.prepare(
        "SELECT hwid, private_key, public_key, address_v4, address_v6, reserved, mtu FROM warp_configs"
      ).all();
      if (configs && configs.length > 0) {
        const updates = configs.map((w: any) => {
          const uri = buildWarpUri({
            private_key: w.private_key || "", public_key: w.public_key || "",
            endpoint: endpoint || "", address_v4: w.address_v4 || "",
            address_v6: w.address_v6 || "", reserved: w.reserved || "",
            mtu: w.mtu || 1280, remark: remark || ""
          });
          return c.env.DB.prepare(
            "UPDATE warp_configs SET endpoint = ?, remark = ?, warp_uri = ?, updated_at = CURRENT_TIMESTAMP WHERE hwid = ?"
          ).bind(endpoint || "", remark || "", uri, w.hwid);
        });
        await c.env.DB.batch(updates);
        propagated = configs.length;
      }
    } catch (propErr) {
      console.error("WARP settings propagation failed (non-fatal):", propErr);
    }

    return c.json({ message: "Settings updated", propagated });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// Generate warp config for a device
app.post("/api/dev/warp/generate", async (c) => {
  const { hwid } = await c.req.json();
  if (!hwid) return c.json({ error: "Missing hwid" }, 400);

  const device = await c.env.DB.prepare("SELECT hwid FROM devices WHERE hwid = ?").bind(hwid).first();
  if (!device) return c.json({ error: "Device not found" }, 404);

  let settings: any = { endpoint: "", remark: "" };
  try {
    settings = await c.env.DB.prepare("SELECT * FROM warp_settings WHERE id = 1").first() || settings;
  } catch {}

  try {
    const warpData = await callVercelWarp(c.env, settings.endpoint || undefined, settings.remark || undefined);
    if (!warpData || !warpData.uri) {
      return c.json({ error: "Vercel WARP returned invalid data: " + JSON.stringify(warpData) }, 500);
    }

    const { success } = await c.env.DB.prepare(
      `INSERT OR REPLACE INTO warp_configs (hwid, config_id, private_key, public_key, endpoint, address_v4, address_v6, reserved, mtu, remark, warp_uri, status, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', CURRENT_TIMESTAMP)`
    ).bind(
      hwid,
      warpData.config_id ?? "",
      warpData.private_key ?? "",
      warpData.public_key ?? "",
      warpData.endpoint ?? "",
      warpData.address_v4 ?? "",
      warpData.address_v6 ?? "",
      warpData.reserved ?? "",
      warpData.mtu ?? 1280,
      warpData.remark ?? "",
      warpData.uri
    ).run();

    if (success) return c.json({ message: "WARP config generated", uri: warpData.uri }, 201);
    return c.json({ error: "Failed to save WARP config" }, 500);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// Regenerate warp config for a device
app.post("/api/dev/warp/regenerate/:hwid", async (c) => {
  const hwid = c.req.param("hwid");

  let settings: any = { endpoint: "", remark: "" };
  try {
    settings = await c.env.DB.prepare("SELECT * FROM warp_settings WHERE id = 1").first() || settings;
  } catch {}

  try {
    const warpData = await callVercelWarp(c.env, settings.endpoint || undefined, settings.remark || undefined);
    if (!warpData || !warpData.uri) {
      return c.json({ error: "Vercel WARP returned invalid data: " + JSON.stringify(warpData) }, 500);
    }

    const { success } = await c.env.DB.prepare(
      `INSERT OR REPLACE INTO warp_configs (hwid, config_id, private_key, public_key, endpoint, address_v4, address_v6, reserved, mtu, remark, warp_uri, status, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', CURRENT_TIMESTAMP)`
    ).bind(
      hwid,
      warpData.config_id ?? "",
      warpData.private_key ?? "",
      warpData.public_key ?? "",
      warpData.endpoint ?? "",
      warpData.address_v4 ?? "",
      warpData.address_v6 ?? "",
      warpData.reserved ?? "",
      warpData.mtu ?? 1280,
      warpData.remark ?? "",
      warpData.uri
    ).run();

    if (success) return c.json({ message: "WARP config regenerated", uri: warpData.uri });
    return c.json({ error: "Failed to regenerate WARP config" }, 500);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// Toggle per-device auto_mode
app.patch("/api/dev/warp/:hwid", async (c) => {
  const hwid = c.req.param("hwid");
  const { auto_mode } = await c.req.json();
  const val = auto_mode ? 1 : 0;

  const { success } = await c.env.DB.prepare(
    "UPDATE warp_configs SET auto_mode = ? WHERE hwid = ?"
  ).bind(val, hwid).run();

  if (success) return c.json({ message: "Auto mode updated" });
  return c.json({ error: "Failed to update auto mode" }, 500);
});

// Edit warp config
app.put("/api/dev/warp/:hwid", async (c) => {
  const hwid = c.req.param("hwid");
  const body = await c.req.json();

  const existing = await c.env.DB.prepare("SELECT * FROM warp_configs WHERE hwid = ?").bind(hwid).first<any>();
  if (!existing) return c.json({ error: "WARP config not found" }, 404);

  const merged = {
    private_key: body.private_key ?? existing.private_key,
    public_key: body.public_key ?? existing.public_key,
    endpoint: body.endpoint ?? existing.endpoint,
    address_v4: body.address_v4 ?? existing.address_v4,
    address_v6: body.address_v6 ?? existing.address_v6,
    reserved: body.reserved ?? existing.reserved,
    mtu: Number(body.mtu) || existing.mtu || 1280,
    remark: body.remark ?? existing.remark,
    status: body.status ?? existing.status,
  };

  const warpUri = buildWarpUri(merged);

  const { success } = await c.env.DB.prepare(
    "UPDATE warp_configs SET private_key = ?, public_key = ?, endpoint = ?, address_v4 = ?, address_v6 = ?, reserved = ?, mtu = ?, remark = ?, status = ?, warp_uri = ?, updated_at = CURRENT_TIMESTAMP WHERE hwid = ?"
  ).bind(
    merged.private_key, merged.public_key, merged.endpoint,
    merged.address_v4, merged.address_v6, merged.reserved,
    merged.mtu, merged.remark, merged.status, warpUri, hwid
  ).run();

  if (success) return c.json({ message: "WARP config updated", uri: warpUri });
  return c.json({ error: "Failed to update WARP config" }, 500);
});

// Delete warp config
app.delete("/api/dev/warp/:hwid", async (c) => {
  const hwid = c.req.param("hwid");
  const { success } = await c.env.DB.prepare("DELETE FROM warp_configs WHERE hwid = ?").bind(hwid).run();

  if (success) return c.json({ message: "WARP config deleted" });
  return c.json({ error: "Failed to delete WARP config" }, 500);
});


// ==========================================
// EXTERNAL API (Third-Party Integration)
// ==========================================

// Dedicated authentication middleware for external API — uses EXTERNAL_API_TOKEN only, never ADMIN_TOKEN
app.use("/api/external/*", async (c, next) => {
  const authHeader = c.req.header("Authorization") || "";
  const token = c.env.EXTERNAL_API_TOKEN;

  if (!token) {
    return c.json({ error: "External API is not configured" }, 503);
  }

  const expected = `Bearer ${token}`;
  if (authHeader !== expected) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  await next();
});

// Dedicated authentication middleware for reseller API — uses EXTERNAL_API_TOKEN only, never ADMIN_TOKEN
app.use("/api/reseller/*", async (c, next) => {
  const authHeader = c.req.header("Authorization") || "";
  const token = c.env.EXTERNAL_API_TOKEN;

  if (!token) {
    return c.json({ error: "Reseller API is not configured" }, 503);
  }

  const expected = `Bearer ${token}`;
  if (authHeader !== expected) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  await next();
});

/**
 * GET /api/external/devices/:hardware_id
 * Read-only: returns device status plus linked event info.
 * Maps: hardware_id → hwid, os_platform → device_info_os
 */
app.get("/api/external/devices/:hardware_id", async (c) => {
  const hardware_id = c.req.param("hardware_id");

  type DeviceRow = {
    hardware_id: string;
    os_platform: string | null;
    expire_date: string | null;
    event_name: string | null;
    event_expire_date: string | null;
    is_promo: number | null;
  };

  const row = await c.env.DB.prepare(`
    SELECT
      d.hwid          AS hardware_id,
      d.device_info_os AS os_platform,
      d.expire_date,
      e.name          AS event_name,
      e.end_date      AS event_expire_date,
      e.is_promo
    FROM devices d
    LEFT JOIN events e ON e.id = d.event_id
    WHERE d.hwid = ?
  `).bind(hardware_id).first<DeviceRow>();

  if (!row) {
    return c.json({ error: "Device not found" }, 404);
  }

  const now = new Date();
  let is_active = false;
  if (row.expire_date) {
    let s = row.expire_date.trim();
    if (!s.endsWith('Z') && !s.includes('+') && s.length <= 19) {
      s = s.replace(' ', 'T') + '+06:30';
    }
    is_active = new Date(s) > now;
  }

  return c.json({
    hardware_id: row.hardware_id,
    os_platform:  row.os_platform,
    expire_date:  row.expire_date,
    event_name:        row.event_name,
    event_expire_date: row.event_expire_date,
    is_promo:     row.is_promo === 1,
    is_active,
  });
});

/**
 * POST /api/external/devices/pre-register
 * Write-only: pre-registers a device (hwid + os_platform) with no event assigned.
 * Uses INSERT OR IGNORE to handle duplicate hardware_id gracefully.
 * Body: { "hardware_id": string, "os_platform": string }
 */
app.post("/api/external/devices/pre-register", async (c) => {
  let body: { hardware_id?: string; os_platform?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const { hardware_id, os_platform } = body;

  if (!hardware_id || typeof hardware_id !== "string" || hardware_id.trim() === "") {
    return c.json({ error: "Missing or invalid field: hardware_id" }, 400);
  }

  if (!os_platform || typeof os_platform !== "string" || os_platform.trim() === "") {
    return c.json({ error: "Missing or invalid field: os_platform" }, 400);
  }

  // Check if device already exists
  const existing = await c.env.DB.prepare(
    "SELECT hwid, device_info_os, expire_date FROM devices WHERE hwid = ?"
  ).bind(hardware_id.trim()).first<{ hwid: string; device_info_os: string | null; expire_date: string | null }>();

  if (existing) {
    return c.json({
      message: "Device already registered",
      device: {
        hardware_id:  existing.hwid,
        os_platform:  existing.device_info_os,
        expire_date:  existing.expire_date,
        event_id:     null,
      },
    }, 200);
  }

  // INSERT OR IGNORE ensures race-condition safety at the DB level as well
  const { success } = await c.env.DB.prepare(
    "INSERT OR IGNORE INTO devices (hwid, device_info_os, event_id, expire_date, user_type) VALUES (?, ?, NULL, NULL, 'reg')"
  ).bind(hardware_id.trim(), os_platform.trim()).run();

  if (!success) {
    return c.json({ error: "Failed to pre-register device" }, 500);
  }

  return c.json({
    message: "Device pre-registered successfully",
    device: {
      hardware_id: hardware_id.trim(),
      os_platform: os_platform.trim(),
      expire_date: null,
      event_id:    null,
    },
  }, 201);
});

/**
 * POST /api/reseller/devices/:hardware_id/upgrade
 * Upserts a device into a target event with a custom number of days.
 * Body: { "event_id": string, "days": number }
 */
app.post("/api/reseller/devices/:hardware_id/upgrade", async (c) => {
  const hardware_id = c.req.param("hardware_id");

  let body: { event_id?: string; days?: number };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const { event_id, days } = body;

  if (!event_id || typeof event_id !== "string" || event_id.trim() === "") {
    return c.json({ error: "Missing or invalid field: event_id" }, 400);
  }

  if (typeof days !== "number" || !Number.isFinite(days) || (days !== 30 && days !== 90)) {
    return c.json({ error: "Invalid field: days (must be exactly 30 or 90)" }, 400);
  }

  const event = await c.env.DB.prepare(
    "SELECT id, link_id, user_type FROM events WHERE id = ?"
  ).bind(event_id.trim()).first<{ id: string; link_id: string; user_type: string }>();

  if (!event) {
    return c.json({ error: "Event not found" }, 404);
  }

  const device = await c.env.DB.prepare(
    "SELECT hwid, expire_date, current_event_id FROM devices WHERE hwid = ?"
  ).bind(hardware_id).first<{ hwid: string; expire_date: string | null; current_event_id: string | null }>();

  const now = new Date();
  let baseDate = now;

  if (device && device.expire_date) {
    let currentExpire = new Date(device.expire_date);
    if (
      isNaN(currentExpire.getTime()) &&
      !device.expire_date.includes('Z') &&
      !device.expire_date.includes('+')
    ) {
      currentExpire = new Date(device.expire_date + '+06:30');
    }
    if (currentExpire > now && device.current_event_id === event.id) {
      baseDate = currentExpire;
    }
  }

  const newExpire = new Date(baseDate);
  newExpire.setDate(newExpire.getDate() + days);
  const expireStr = newExpire.toISOString();

  let created = false;

  if (!device) {
    const { success } = await c.env.DB.prepare(
      "INSERT INTO devices (hwid, device_info_os, event_id, current_event_id, link_id, expire_date, user_type) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).bind(hardware_id, null, event.id, event.id, event.link_id, expireStr, 'paid').run();

    if (!success) {
      return c.json({ error: "Failed to upgrade device" }, 500);
    }

    created = true;
  } else {
    const { success } = await c.env.DB.prepare(
      "UPDATE devices SET event_id = ?, current_event_id = ?, link_id = ?, expire_date = ?, user_type = 'paid' WHERE hwid = ?"
    ).bind(event.id, event.id, event.link_id, expireStr, hardware_id).run();

    if (!success) {
      return c.json({ error: "Failed to upgrade device" }, 500);
    }
  }

  return c.json({
    message: "Device upgraded successfully",
    created,
    device: {
      hardware_id,
      event_id: event.id,
      user_type: 'paid',
      expire_date: expireStr,
    },
  });
});

// ==========================================
// PUBLIC SUBSCRIPTION ENDPOINT
// ==========================================

app.get("/sub/:uuid", async (c) => {
  const uuid = c.req.param("uuid");
  const eventCode = c.req.query("event_code");

  // Browser Detection Logic
  const userAgent = c.req.header("User-Agent") || "";
  const accept = c.req.header("Accept") || "";
  if (userAgent.toLowerCase().includes("mozilla") || accept.toLowerCase().includes("text/html")) {
    return c.html(postcardHtmlTemplate);
  }

  console.log("Incoming Headers:", c.req.header());

  const encodeBase64 = (str: string) => btoa(unescape(encodeURIComponent(str)));

  const getMMTDate = (dateStr: string) => {
    let s = dateStr.trim();
    if (!s.endsWith('Z') && !s.includes('+') && s.length <= 19) {
      s = s.replace(' ', 'T') + '+06:30';
    }
    return new Date(s);
  };

  let calculatedDiffHours: number | undefined = undefined;

  const getAnnounceText = async (key: string, eventId?: string) => {
    let ann = null;
    if (eventId) {
      ann = await c.env.DB.prepare("SELECT message FROM announcements WHERE key = ? AND target_event_id = ?").bind(key, eventId).first<{ message: string }>();
    }
    if (!ann) {
      ann = await c.env.DB.prepare("SELECT message FROM announcements WHERE key = ? AND target_event_id = 'global'").bind(key).first<{ message: string }>();
    }
    let rawMsg = ann ? ann.message : key;

    if (rawMsg.includes('%time%') && calculatedDiffHours !== undefined) {
      let formattedTime = calculatedDiffHours > 1 ? `${calculatedDiffHours} Hours` : "1 Hour";
      if (calculatedDiffHours <= 0) formattedTime = "0 Hours";
      rawMsg = rawMsg.replace(/%time%/g, formattedTime);
    }

    return `base64:${encodeBase64(rawMsg)}`;
  };

  if (!eventCode) {
    return new Response(encodeBase64(""), { headers: { "announce": await getAnnounceText("limit_device") }, status: 200 });
  }

  // Step B: Event & Device Validation (Early fetch to ensure profile-title is everywhere)
  const eventData = await c.env.DB.prepare("SELECT id as event_id, name as event_name, link_id, user_type, allowed_user, allowed_os, event_type, joined_users, end_date, is_promo, allow_days FROM events WHERE event_code = ?").bind(eventCode).first<{ event_id: string, event_name: string, link_id: string, user_type: string, allowed_user: number, allowed_os: string, event_type: string, joined_users: number, end_date: string | null, is_promo: number, allow_days: number }>();

  const rejectResp = async (announceKey: string, eventId?: string) => {
    const headers = new Headers();
    headers.set("announce", await getAnnounceText(announceKey, eventId));
    if (eventData) headers.set("profile-title", `base64:${encodeBase64(eventData.event_name)}`);
    return new Response(encodeBase64(""), { headers, status: 200 });
  };

  if (!eventData || eventData.link_id !== uuid) {
    return await rejectResp("limit_device");
  }
  const payload = eventData;

  const hwid = c.req.header("x-hwid") || c.req.header("hwid");
  const os = c.req.header("x-device-os") || c.req.header("x-app-os") || c.req.header("os");

  if (!hwid || !os) {
    return await rejectResp("miss_hwid", payload.event_id);
  }

  let device = await c.env.DB.prepare("SELECT * FROM devices WHERE hwid = ?").bind(hwid).first();
  let returnBlank = false;
  let announceKey = "normal";

  // Abuse Prevention: Device already on another event cannot join a free event
  if (device && device.current_event_id && device.current_event_id !== payload.event_id && payload.user_type === 'free') {
    return await rejectResp("no_more_free", payload.event_id);
  }

  // Expired promo users cannot join a different free or promo event
  if (device && device.user_type === 'promo' && device.expire_date && device.current_event_id !== payload.event_id) {
    const expired = new Date() > getMMTDate(device.expire_date as string);
    if (expired && (payload.user_type === 'free' || payload.user_type === 'promo')) {
      return await rejectResp("promo_used", payload.event_id);
    }
  }

  // Cross-type blocking: device type must match event type.
  // Reg devices can only join free events; paid/free/promo must match exactly.
  if (device) {
    if (device.user_type === 'reg' && payload.user_type !== 'free') {
      return await rejectResp("wrong_hwid", payload.event_id);
    }
    if (['free', 'paid', 'promo'].includes(device.user_type as string) && device.user_type !== payload.user_type) {
      return await rejectResp("wrong_hwid", payload.event_id);
    }
  }

  // Strict HWID validation — ONLY for pre-bound hwid events
  if (payload.event_type === "hwid" && device) {
    // Pre-bound events require the device to already be assigned to THIS exact event
    if (device.current_event_id && device.current_event_id !== payload.event_id) {
      return await rejectResp("wrong_hwid", payload.event_id);
    }
  }

  const isNewDeviceForEvent = !device || (device.current_event_id !== payload.event_id) || (device.user_type === 'reg');

  if (isNewDeviceForEvent) {
    if (payload.end_date && new Date() > getMMTDate(payload.end_date)) {
      returnBlank = true;
      announceKey = "limit_device";
    } else if (payload.user_type === 'promo' && device && device.user_type === 'promo') {
      // Device already used a promo event — block re-use
      returnBlank = true;
      announceKey = "promo_used";
    } else if (payload.allowed_os !== "all" && payload.allowed_os.toLowerCase() !== os.toLowerCase()) {
      returnBlank = true;
      announceKey = "limit_os";
    } else {
      // 2. Check allowed_user against actual device count for this event
      const slotRow = await c.env.DB.prepare(
        "SELECT COUNT(*) AS cnt FROM devices WHERE current_event_id = ?"
      ).bind(payload.event_id).first<{ cnt: number }>();
      const currentCount = slotRow?.cnt || 0;

      if (payload.allowed_user > 0 && currentCount >= payload.allowed_user) {
        returnBlank = true;
        announceKey = "limit_device";
      } else {
        // 3. Check event_type (strict hwid mapping rule)
        if (payload.event_type === "hwid" && !device) {
          returnBlank = true;
          announceKey = "wrong_hwid";
        } else {
          // 5. Success! Register new device / update event on existing
          const allowDays = payload.allow_days || 30;
          const expireDate = new Date();
          expireDate.setDate(expireDate.getDate() + allowDays);
          const expireStr = expireDate.toISOString();
          
          if (!device) {
            await c.env.DB.prepare(
              "INSERT INTO devices (hwid, device_info_os, event_id, current_event_id, link_id, expire_date, user_type) VALUES (?, ?, ?, ?, ?, ?, ?)"
            ).bind(hwid, os, payload.event_id, payload.event_id, payload.link_id, expireStr, payload.user_type).run();
          } else {
            await c.env.DB.prepare(
              "UPDATE devices SET event_id = ?, current_event_id = ?, link_id = ?, expire_date = ?, user_type = ?, device_info_os = ? WHERE hwid = ?"
            ).bind(payload.event_id, payload.event_id, payload.link_id, expireStr, payload.user_type, os, hwid).run();
          }

          device = await c.env.DB.prepare("SELECT * FROM devices WHERE hwid = ?").bind(hwid).first();

          // Auto-connect: generate WARP config for new device if global auto_connect is ON
          try {
            const warpSettings = await c.env.DB.prepare("SELECT auto_connect, endpoint, remark FROM warp_settings WHERE id = 1").first<{ auto_connect: number; endpoint: string; remark: string }>();
            if (warpSettings && warpSettings.auto_connect === 1) {
              const existingWarp = await c.env.DB.prepare("SELECT hwid FROM warp_configs WHERE hwid = ?").bind(hwid).first();
              if (!existingWarp) {
                const warpData = await callVercelWarp(c.env, warpSettings.endpoint || undefined, warpSettings.remark || undefined);
                if (warpData && warpData.uri) {
                  await c.env.DB.prepare(
                    `INSERT OR REPLACE INTO warp_configs (hwid, config_id, private_key, public_key, endpoint, address_v4, address_v6, reserved, mtu, remark, warp_uri, auto_mode, status, updated_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'active', CURRENT_TIMESTAMP)`
                  ).bind(
                    hwid,
                    warpData.config_id ?? "",
                    warpData.private_key ?? "",
                    warpData.public_key ?? "",
                    warpData.endpoint ?? "",
                    warpData.address_v4 ?? "",
                    warpData.address_v6 ?? "",
                    warpData.reserved ?? "",
                    warpData.mtu ?? 1280,
                    warpData.remark ?? "",
                    warpData.uri
                  ).run();
                }
              }
            }
          } catch (warpErr) {
            console.error("WARP auto-connect failed (non-fatal):", warpErr);
          }
        }
      }
    }
  }

  // Fetch the link to get customized configs
  const link = await c.env.DB.prepare("SELECT custom_parameters, combined_configs FROM links WHERE id = ?").bind(uuid).first<{ custom_parameters: string, combined_configs: string }>();
  if (!link) {
    return await rejectResp("limit_device", payload.event_id);
  }

  // Step C: Status Check & Header Injection
  if (!returnBlank && device && device.expire_date) {
    const expireDate = getMMTDate(device.expire_date as string);
    const now = new Date();
    const remaining_ms = expireDate.getTime() - now.getTime();
    const diffHrs = Math.ceil(remaining_ms / (1000 * 60 * 60));

    calculatedDiffHours = diffHrs;

    if (diffHrs <= 0) {
      returnBlank = true;
      announceKey = "renew";
    } else if (diffHrs <= 72) {
      announceKey = "expire";
    } else {
      announceKey = "normal";
    }
  }

  // Step 5: Payload Generation Rules
  const headers = new Headers();
  headers.set("Content-Type", "text/plain; charset=utf-8");
  headers.set("profile-update-interval", "1");
  headers.set("update-always", "true");
  headers.set("announce", await getAnnounceText(announceKey, payload.event_id));

  // Custom Header: Profile-Title
  headers.set("profile-title", `base64:${encodeBase64(payload.event_name)}`);

  if (!returnBlank && device && device.expire_date) {
    const expireUnix = Math.floor(getMMTDate(device.expire_date as string).getTime() / 1000);
    headers.set("subscription-userinfo", `upload=0; download=0; total=0; expire=${expireUnix}`);
  }

  if (returnBlank || !device) {
    return new Response(encodeBase64(""), { headers, status: 200 });
  }

  // Combine and encode configs
  let finalConfigStr = "";

  if (link.custom_parameters) {
    finalConfigStr += link.custom_parameters + "\n";
  }

  // WARP wireguard URI
  if (device) {
    try {
      const warpRow = await c.env.DB.prepare("SELECT warp_uri FROM warp_configs WHERE hwid = ? AND status = 'active'").bind(hwid).first<{ warp_uri: string }>();
      if (warpRow && warpRow.warp_uri) {
        finalConfigStr += warpRow.warp_uri + "\n";
      }
    } catch {}
  }

  if (link.combined_configs) {
    finalConfigStr += link.combined_configs;
  }

  return new Response(encodeBase64(finalConfigStr.trim()), { headers, status: 200 });
});

export default app;
