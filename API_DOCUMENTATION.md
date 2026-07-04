# V-Panel API Documentation

> **Base URL:** `https://v-panel.serverbyhtet.workers.dev`

---

## Table of Contents

1. [Authentication](#authentication)
2. [Public Routes](#public-routes)
3. [Client Subscription API](#client-subscription-api)
4. [Admin API — Configs](#admin-api--configs)
5. [Admin API — Links](#admin-api--links)
6. [Admin API — Events](#admin-api--events)
7. [Admin API — Devices](#admin-api--devices)
8. [Admin API — Announcements](#admin-api--announcements)
9. [External Integration — Happ Crypto API](#external-integration--happ-crypto-api)
10. [Announcement Keys Reference](#announcement-keys-reference)

---

## Authentication

All `/api/admin/*` endpoints require **Bearer Token** authentication.

| Header          | Value                    |
|-----------------|--------------------------|
| `Authorization` | `Bearer <ADMIN_TOKEN>`   |

> The `ADMIN_TOKEN` is configured as a Cloudflare Worker secret.

Unauthorized requests receive:
```json
{ "error": "Unauthorized" }
```
**Status:** `401`

---

## Public Routes

### `GET /`
Health check endpoint.

**Response:** `200 OK`
```
V-Panel API is running
```

### `GET /admin`
Serves the Admin Dashboard UI (single-page HTML application).

---

## Client Subscription API

### `GET /sub/:uuid`

The core subscription endpoint used by VPN clients (e.g., Happ). This endpoint validates device identity, enforces event rules, and returns encrypted VPN configuration payloads.

> **CRITICAL:** This endpoint **always** returns HTTP `200 OK`, even on rejection. VPN clients cannot read response headers on `403`/`500` status codes.

#### URL Parameters

| Parameter | Type   | Required | Description                        |
|-----------|--------|----------|------------------------------------|
| `uuid`    | string | ✅       | The Base Link UUID (from `links` table) |

#### Query Parameters

| Parameter    | Type   | Required | Description                              |
|--------------|--------|----------|------------------------------------------|
| `event_code` | string | ✅       | The 12-char hex event code (auto-generated) |

#### Request Headers

| Header         | Aliases                          | Required | Description              |
|----------------|----------------------------------|----------|--------------------------|
| `X-HWID`       | `hwid`                           | ✅       | Device hardware identifier |
| `X-Device-OS`  | `X-App-OS`, `os`                 | ✅       | Device OS (`Android`, `iOS`, `Windows`, `Mac`) |

#### Validation Flow

```
1. Missing event_code?        → Reject: announce=limit_device
2. Invalid event or UUID mismatch? → Reject: announce=limit_device
3. Missing HWID or OS header?     → Reject: announce=miss_hwid
4. Expired free user?             → Permanent Ban: announce=no_more_free
5. Reg device → paid event?       → Reject: announce=wrong_hwid
6. Cross-type (free↔paid)?        → Reject: announce=wrong_hwid
7. Already linked to different event? → Reject: announce=wrong_hwid
8. Wrong OS for event?            → Reject: announce=limit_os
9. Event slots full?              → Reject: announce=limit_device
10. HWID-only event, no pre-reg?  → Reject: announce=wrong_hwid
11. All passed                    → Register device, return configs
```

#### Response Headers (Always Present)

| Header                   | Description                                                      |
|--------------------------|------------------------------------------------------------------|
| `announce`               | `base64:<encoded_message>` — Status message from announcements DB |
| `profile-title`          | `base64:<encoded_event_name>` — The event name (always included when event is valid) |
| `profile-update-interval`| `1` (minutes between client refresh)                             |
| `subscription-userinfo`  | `upload=0; download=0; total=10737418240; expire=<unix_ts>` — Only on active, validated users |
| `Content-Type`           | `text/plain; charset=utf-8`                                      |

#### Response Body

| Scenario           | Body                                    |
|--------------------|-----------------------------------------|
| **Rejected**       | Base64-encoded empty string (`""`)      |
| **Success**        | Base64-encoded VPN config payload       |

#### Example: Successful Request

```bash
curl -H "X-HWID: abc123def456" \
     -H "X-Device-OS: Android" \
     "https://v-panel.serverbyhtet.workers.dev/sub/550e8400-e29b-41d4-a716-446655440000?event_code=a1b2c3d4e5f6"
```

**Response Headers:**
```
announce: base64:V2VsY29tZSE=
profile-title: base64:RnJlZSBFdmVudA==
profile-update-interval: 1
subscription-userinfo: upload=0; download=0; total=10737418240; expire=1718000000
```

**Response Body:** Base64-encoded VPN config string

---

## Admin API — Configs

Server configuration nodes (VLESS/Trojan URIs).

### `GET /api/admin/configs`

List all configs.

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "name": "Singapore SG-01",
    "node": "vless://uuid@server:443?type=ws&security=tls#SG-01"
  }
]
```

### `GET /api/admin/configs/:id`

Get a single config by ID.

**Response:** `200 OK`
```json
{
  "id": 1,
  "name": "Singapore SG-01",
  "node": "vless://uuid@server:443?type=ws&security=tls#SG-01"
}
```

### `POST /api/admin/configs`

Create a new config.

**Request Body:**
```json
{
  "name": "Singapore SG-01",
  "node": "vless://uuid@server:443?type=ws&security=tls#SG-01"
}
```

**Response:** `201 Created`
```json
{ "message": "Config created" }
```

### `PUT /api/admin/configs/:id`

Update an existing config.

**Request Body:**
```json
{
  "name": "Singapore SG-02",
  "node": "vless://uuid@newserver:443?type=ws&security=tls#SG-02"
}
```

**Response:** `200 OK`
```json
{ "message": "Config updated" }
```

### `DELETE /api/admin/configs/:id`

Delete a config.

**Response:** `200 OK`
```json
{ "message": "Config deleted" }
```

---

## Admin API — Links

Base subscription links that bundle configs with custom parameters.

### `GET /api/admin/links`

List all links.

**Response:** `200 OK`
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "remark": "Main Link",
    "custom_parameters": "#profile-update-interval: 2\n#support-url: https://t.me/H2Tunnel",
    "combined_configs": "vless://...#SG-01\nvless://...#JP-01"
  }
]
```

### `POST /api/admin/links`

Create a new link.

**Request Body:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "remark": "Main Link",
  "custom_parameters": "#profile-update-interval: 2",
  "combined_configs": "vless://...#SG-01\nvless://...#JP-01"
}
```

> `id` is a client-generated UUID.

**Response:** `201 Created`
```json
{ "message": "Link created", "id": "550e8400-e29b-41d4-a716-446655440000" }
```

### `PUT /api/admin/links/:id`

Update an existing link.

**Request Body:**
```json
{
  "remark": "Updated Link",
  "custom_parameters": "#support-url: https://t.me/H2Tunnel",
  "combined_configs": "vless://...#SG-02"
}
```

**Response:** `200 OK`
```json
{ "message": "Link updated" }
```

### `DELETE /api/admin/links/:id`

Delete a link.

**Response:** `200 OK`
```json
{ "message": "Link deleted" }
```

---

## Admin API — Events

Event subscriptions that control user access, device limits, and slot tracking.

### `GET /api/admin/events`

List all events.

**Response:** `200 OK`
```json
[
  {
    "id": "event-uuid-here",
    "name": "Free April Event",
    "event_type": "limited",
    "remark": "Promo",
    "link_id": "550e8400-...",
    "allowed_user": 50,
    "joined_users": 12,
    "user_type": "free",
    "allowed_os": "all",
    "start_date": "2026-04-01T00:00:00",
    "end_date": "2026-04-30T00:00:00",
    "event_code": "a1b2c3d4e5f6",
    "happ_link": "happ://crypt5/..."
  }
]
```

### `POST /api/admin/events`

Create a new event. Automatically generates:
- A unique `event_code` (12-char hex token)
- An encrypted `happ_link` via the Happ Crypto API

**Request Body:**
```json
{
  "id": "event-uuid-here",
  "name": "Free April Event",
  "event_type": "limited",
  "remark": "Promo",
  "link_id": "550e8400-...",
  "allowed_user": 50,
  "user_type": "free",
  "allowed_os": "all",
  "start_date": "2026-04-01T00:00:00",
  "end_date": "2026-04-30T00:00:00"
}
```

| Field          | Type    | Required | Values                                      |
|----------------|---------|----------|---------------------------------------------|
| `id`           | string  | ✅       | Client-generated UUID                        |
| `name`         | string  | ✅       | Display name for the event                   |
| `event_type`   | string  | ✅       | `limited` or `hwid`                          |
| `link_id`      | string  | ✅       | UUID referencing a Base Link                 |
| `user_type`    | string  | ✅       | `free`, `paid`, or `promo`                   |
| `allowed_os`   | string  | ✅       | `all`, `Android`, `iOS`, `Mac`, `Windows`    |
| `allowed_user` | number  | ❌       | Max device slots (0 = unlimited)             |
| `remark`       | string  | ❌       | Admin notes                                  |
| `start_date`   | string  | ❌       | ISO datetime                                 |
| `end_date`     | string  | ❌       | ISO datetime                                 |

**Response:** `201 Created`
```json
{
  "message": "Event created",
  "id": "event-uuid-here",
  "event_code": "a1b2c3d4e5f6",
  "happ_link": "happ://crypt5/..."
}
```

> If the Happ Crypto API fails, `happ_link` will be `null` but the event is still created.

### `PUT /api/admin/events/:id`

Update an existing event. **Also regenerates** the `happ_link` using the updated `link_id` and existing `event_code`.

**Request Body:** Same fields as POST (excluding `id`).

**Response:** `200 OK`
```json
{
  "message": "Event updated",
  "happ_link": "happ://crypt5/..."
}
```

### `DELETE /api/admin/events/:id`

Delete an event.

**Response:** `200 OK`
```json
{ "message": "Event deleted" }
```

---

## Admin API — Devices

Manages VPN client devices identified by their hardware ID (HWID).

### `GET /api/admin/devices`

List all devices.

**Response:** `200 OK`
```json
[
  {
    "hwid": "abc123def456",
    "device_info_os": "Android",
    "link_id": "550e8400-...",
    "event_id": "event-uuid",
    "current_event_id": "event-uuid",
    "first_date": "2026-04-10T12:00:00Z",
    "expire_date": "2026-05-10T12:00:00Z",
    "user_type": "free"
  }
]
```

### `POST /api/admin/devices`

Pre-register a device (sets `user_type` to `reg`).

**Request Body:**
```json
{
  "hwid": "abc123def456",
  "device_info_os": "Android"
}
```

**Response:** `201 Created`
```json
{ "message": "Device pre-registered", "hwid": "abc123def456" }
```

**Error — Duplicate:** `409 Conflict`
```json
{
  "error": "Already registered! This device is currently marked as free and joined to event: Free April Event."
}
```

### `PUT /api/admin/devices/:hwid`

Update a device. Accepts `event_id` — the backend automatically resolves `link_id` from the event.

**Request Body:**
```json
{
  "user_type": "paid",
  "event_id": "event-uuid",
  "device_info_os": "Android",
  "expire_date": "2026-06-10T00:00:00Z"
}
```

| Field            | Type   | Description                                       |
|------------------|--------|---------------------------------------------------|
| `user_type`      | string | `free`, `paid`, `promo`, or `reg`                 |
| `event_id`       | string | UUID of the event to assign (auto-resolves link)  |
| `device_info_os` | string | Device OS info                                    |
| `expire_date`    | string | ISO datetime for subscription expiry              |

**Response:** `200 OK`
```json
{ "message": "Device updated" }
```

### `DELETE /api/admin/devices/:hwid`

Delete / revoke a device.

**Response:** `200 OK`
```json
{ "message": "Device deleted" }
```

---

## Admin API — Announcements

Dynamic messages returned to VPN clients via the `announce` response header.

### `GET /api/admin/announcements`

List all announcements.

**Response:** `200 OK`
```json
[
  { "key": "normal", "message": "Welcome!" },
  { "key": "expire", "message": "Your subscription expires soon." },
  { "key": "renew", "message": "Subscription expired. Please renew." }
]
```

### `PUT /api/admin/announcements`

Bulk update all announcement messages (upsert).

**Request Body:**
```json
{
  "normal": "Welcome to V-Panel VPN!",
  "expire": "⚠️ Your plan expires in 3 days.",
  "renew": "❌ Subscription expired. Contact admin.",
  "limit_device": "Device limit reached for this event.",
  "limit_os": "Your OS is not supported for this event.",
  "wrong_hwid": "Access denied for this device.",
  "miss_hwid": "Missing device identification headers.",
  "no_more_free": "Free trial expired. No more free access."
}
```

**Response:** `200 OK`
```json
{ "message": "Announcements updated" }
```

---

## External Integration — Happ Crypto API

The system integrates with an external encryption service to generate `happ://` deep links.

### When It's Called

| Trigger                     | Endpoint Called                          |
|-----------------------------|------------------------------------------|
| Creating a new event (POST) | `https://crypto.happ.su/api-v2.php`      |
| Updating an event (PUT)     | `https://crypto.happ.su/api-v2.php`      |

### Request (Outgoing)

```http
POST https://crypto.happ.su/api-v2.php
Content-Type: application/json

{
  "url": "https://v-panel.serverbyhtet.workers.dev/sub/550e8400-...?event_code=a1b2c3d4e5f6"
}
```

### Response (Incoming)

```json
{
  "encrypted_link": "happ://crypt5/eyJhbGciOiJIUzI1NiJ9..."
}
```

### Error Handling

- The crypto API call is wrapped in a `try/catch` block.
- If the external API is **down or fails**, the event creation/update **still succeeds**.
- The `happ_link` field is saved as `null` on failure.
- Errors are logged to the Worker console for debugging.

---

## Admin API — WARP

Manages Cloudflare WARP (WireGuard) configs bound to devices.

### `GET /api/dev/warp`

List all WARP configs joined with device info.

**Response:** `200 OK`
```json
[
  {
    "hwid": "abc123",
    "endpoint": "162.159.193.8:2408",
    "remark": "Local Anycast",
    "auto_mode": 0,
    "status": "active",
    "warp_uri": "wireguard://...",
    "device_info_os": "Android",
    "user_type": "free",
    "event_name": "Free Trial"
  }
]
```

### `GET /api/dev/warp/settings`

Get global WARP settings.

**Response:** `200 OK`
```json
{ "id": 1, "auto_connect": 0, "endpoint": "162.159.193.8:500", "remark": "Local Anycast" }
```

### `PUT /api/dev/warp/settings`

Update global WARP settings. **Also propagates** the new `endpoint` and `remark` to all existing `warp_configs`, rebuilding their `warp_uri` in-place (keys preserved, no external calls).

**Request Body:**
```json
{
  "auto_connect": 1,
  "endpoint": "162.159.193.8:500",
  "remark": "Local Anycast"
}
```

**Response:** `200 OK`
```json
{ "message": "Settings updated", "propagated": 5 }
```

### `POST /api/dev/warp/generate`

Generate a new WARP config for a device (calls external Vercel function to register with Cloudflare).

**Request Body:**
```json
{ "hwid": "abc123" }
```

**Response:** `201 Created`
```json
{ "message": "WARP config generated", "uri": "wireguard://..." }
```

### `POST /api/dev/warp/regenerate/:hwid`

Regenerate WARP config for a device (re-registers with Cloudflare, replaces keys).

**Response:** `200 OK`
```json
{ "message": "WARP config regenerated", "uri": "wireguard://..." }
```

### `PUT /api/dev/warp/:hwid`

Edit a WARP config's structured fields. The `warp_uri` is automatically rebuilt from the provided fields. Only provided fields are updated; omitted fields retain their current values.

**Request Body:**
```json
{
  "endpoint": "162.159.193.8:500",
  "remark": "New Remark",
  "mtu": 1280,
  "address_v4": "172.16.0.2/32",
  "address_v6": "2606:4700:110:8a18::/128",
  "reserved": "1, 2, 3",
  "public_key": "bmXOC+F1FxEMF9dyiK2H5/1SUtzH0JuVo51h2wPfgyo=",
  "private_key": "base64key...",
  "status": "active"
}
```

**Response:** `200 OK`
```json
{ "message": "WARP config updated", "uri": "wireguard://..." }
```

### `PATCH /api/dev/warp/:hwid`

Toggle per-device auto mode.

**Request Body:**
```json
{ "auto_mode": true }
```

**Response:** `200 OK`
```json
{ "message": "Auto mode updated" }
```

### `DELETE /api/dev/warp/:hwid`

Delete a WARP config.

**Response:** `200 OK`
```json
{ "message": "WARP config deleted" }
```

---

## Announcement Keys Reference

| Key             | Trigger Condition                                          |
|-----------------|------------------------------------------------------------|
| `normal`        | Active, valid subscription (>72 hours remaining)           |
| `expire`        | Subscription expires within 72 hours                       |
| `renew`         | Paid user's subscription has expired                       |
| `limit_device`  | Event device slots are full                                |
| `limit_os`      | Device OS doesn't match event's `allowed_os`               |
| `wrong_hwid`    | Cross-type blocking, event switching, or HWID-only reject  |
| `miss_hwid`     | Missing `X-HWID` or `X-Device-OS` headers                 |
| `no_more_free`  | Free user's subscription expired (permanent ban)           |

---

## Database Schema

### `configs`
| Column | Type    | Description           |
|--------|---------|-----------------------|
| id     | INTEGER | Auto-increment PK     |
| name   | TEXT    | Config display name   |
| node   | TEXT    | VLESS/Trojan URI      |

### `links`
| Column            | Type | Description               |
|-------------------|------|---------------------------|
| id                | TEXT | UUID (PK)                 |
| remark            | TEXT | Admin notes               |
| custom_parameters | TEXT | Custom header parameters  |
| combined_configs  | TEXT | Concatenated node URIs    |

### `events`
| Column       | Type     | Description                       |
|--------------|----------|-----------------------------------|
| id           | TEXT     | UUID (PK)                         |
| name         | TEXT     | Event display name                |
| event_type   | TEXT     | `limited` or `hwid`               |
| remark       | TEXT     | Admin notes                       |
| link_id      | TEXT     | FK → links.id                     |
| allowed_user | INTEGER  | Max devices (0=unlimited)         |
| joined_users | INTEGER  | Current device count              |
| user_type    | TEXT     | `free`, `paid`, or `promo`        |
| allowed_os   | TEXT     | `all`, `Android`, `iOS`, etc.     |
| start_date   | DATETIME | Event start                       |
| end_date     | DATETIME | Event end                         |
| event_code   | TEXT     | 12-char hex token (auto-generated)|
| happ_link    | TEXT     | Encrypted happ:// link (nullable) |

### `devices`
| Column           | Type     | Description                     |
|------------------|----------|---------------------------------|
| hwid             | TEXT     | Hardware ID (PK)                |
| device_info_os   | TEXT     | Device OS string                |
| link_id          | TEXT     | FK → links.id                   |
| event_id         | TEXT     | FK → events.id (initial)        |
| current_event_id | TEXT     | FK → events.id (active)         |
| first_date       | DATETIME | Auto-set on creation            |
| expire_date      | DATETIME | Subscription expiry             |
| user_type        | TEXT     | `free`, `paid`, `promo`, `reg`  |

### `announcements`
| Column  | Type | Description             |
|---------|------|-------------------------|
| key     | TEXT | Announcement key (PK)   |
| message | TEXT | Message text             |

### `warp_configs`
| Column       | Type     | Description                          |
|--------------|----------|--------------------------------------|
| hwid         | TEXT     | Hardware ID (PK, FK → devices)       |
| config_id    | TEXT     | Cloudflare config ID                 |
| private_key  | TEXT     | WireGuard private key (base64)       |
| public_key   | TEXT     | Peer public key (base64)             |
| endpoint     | TEXT     | WireGuard endpoint (host:port)       |
| address_v4   | TEXT     | IPv4 address with CIDR               |
| address_v6   | TEXT     | IPv6 address with CIDR (nullable)    |
| reserved     | TEXT     | Reserved bytes (e.g. "1, 2, 3")      |
| mtu          | INTEGER  | MTU (default 1280)                   |
| remark       | TEXT     | Config remark (URI fragment)         |
| warp_uri     | TEXT     | Full wireguard:// URI (auto-built)   |
| auto_mode    | INTEGER  | Per-device auto mode (0/1)           |
| status       | TEXT     | `active` or `error`                  |
| created_at   | DATETIME | Auto-set on creation                 |
| updated_at   | DATETIME | Auto-set on update                   |

### `warp_settings`
| Column       | Type    | Description                              |
|--------------|---------|------------------------------------------|
| id           | INTEGER | Always 1 (singleton)                     |
| auto_connect | INTEGER | Auto-generate WARP for new devices (0/1) |
| endpoint     | TEXT    | Default endpoint for new configs         |
| remark       | TEXT    | Default remark for new configs           |
