# V-Panel API Documentation

> **Base URL:** `https://v-panel.serverbyhtet.workers.dev`

---

## Table of Contents

1. [Authentication](#authentication)
2. [Public Routes](#public-routes)
3. [Client Subscription API](#client-subscription-api)
4. [Admin API — Proxies](#admin-api--proxies)
5. [Admin API — Configs](#admin-api--configs)
6. [Admin API — Links](#admin-api--links)
7. [Admin API — Events](#admin-api--events)
8. [Admin API — Devices](#admin-api--devices)
9. [Admin API — Announcements](#admin-api--announcements)
10. [Admin API — WARP](#admin-api--warp)
11. [External API — Devices](#external-api--devices)
12. [Reseller API — Device Upgrade](#reseller-api--device-upgrade)
13. [External Integration — Happ Crypto API](#external-integration--happ-crypto-api)
14. [Announcement Keys Reference](#announcement-keys-reference)
15. [Database Schema](#database-schema)

---

## Authentication

All `/api/dev/*` (Admin) endpoints require **Bearer Token** authentication.

| Header          | Value                    |
|-----------------|--------------------------|
| `Authorization` | `Bearer <ADMIN_TOKEN>`   |

> The `ADMIN_TOKEN` is configured as a Cloudflare Worker secret.

External APIs (`/api/external/*`) use a separate **Bearer Token** authentication:

| Header          | Value                           |
|-----------------|---------------------------------|
| `Authorization` | `Bearer <EXTERNAL_API_TOKEN>`   |

Unauthorized requests receive:
```json
{ "error": "Unauthorized" }
```
**Status:** `401`

---

## Public Routes

### `GET /`
Health check and Landing Page endpoint.

**Response:** `200 OK` (HTML)

### `GET /dev`
Serves the Admin Dashboard UI (single-page HTML application).

**Response:** `200 OK` (HTML)

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
5. Promo already used?            → Reject: announce=promo_used
6. Reg device → paid event?       → Reject: announce=wrong_hwid
7. Cross-type (free↔paid)?        → Reject: announce=wrong_hwid
8. Already linked to different event? → Reject: announce=wrong_hwid
9. Wrong OS for event?            → Reject: announce=limit_os
10. Event slots full?             → Reject: announce=limit_device
11. HWID-only event, no pre-reg?  → Reject: announce=wrong_hwid
12. All passed                    → Register device, return configs
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

---

## Admin API — Proxies

Proxy configurations for the system.

### `GET /api/dev/proxies`

List all proxies.

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "name": "Cloudflare Proxy",
    "url": "https://proxy.example.com",
    "is_active": 1,
    "created_at": "2026-04-01T00:00:00"
  }
]
```

### `GET /api/dev/proxies/active`

List all active proxies.

**Response:** `200 OK`

### `POST /api/dev/proxies`

Create a new proxy.

**Request Body:**
```json
{
  "name": "Cloudflare Proxy",
  "url": "https://proxy.example.com",
  "is_active": true
}
```

**Response:** `201 Created`
```json
{ "message": "Proxy created" }
```

### `PUT /api/dev/proxies/:id`

Update an existing proxy.

**Request Body:**
```json
{
  "name": "Cloudflare Proxy Updated",
  "url": "https://proxy2.example.com",
  "is_active": false
}
```

**Response:** `200 OK`
```json
{ "message": "Proxy updated" }
```

### `DELETE /api/dev/proxies/:id`

Delete a proxy.

**Response:** `200 OK`
```json
{ "message": "Proxy deleted" }
```

---

## Admin API — Configs

Server configuration nodes (VLESS/Trojan URIs).

### `GET /api/dev/configs`

List all configs. Ordered by position or id.

### `GET /api/dev/configs/:id`

Get a single config by ID.

### `POST /api/dev/configs`

Create a new config.

**Request Body:**
```json
{
  "name": "Singapore SG-01",
  "node": "vless://uuid@server:443?type=ws&security=tls#SG-01"
}
```

**Response:** `201 Created`

### `PUT /api/dev/configs/:id`

Update an existing config.

**Request Body:**
```json
{
  "name": "Singapore SG-02",
  "node": "vless://uuid@newserver:443?type=ws&security=tls#SG-02"
}
```

**Response:** `200 OK`

### `PUT /api/dev/configs/reorder`

Reorder configs position.

**Request Body:**
```json
{
  "ids": [2, 1, 3]
}
```

**Response:** `200 OK`
```json
{ "message": "Positions reordered successfully" }
```

### `DELETE /api/dev/configs/:id`

Delete a config.

**Response:** `200 OK`

---

## Admin API — Links

Base subscription links that bundle configs with custom parameters.

### `GET /api/dev/links`

List all links.

### `POST /api/dev/links`

Create a new link.

**Request Body:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "remark": "Main Link",
  "custom_parameters": "#profile-update-interval: 2",
  "combined_configs": "vless://...#SG-01
vless://...#JP-01"
}
```

> `id` is a client-generated UUID.

**Response:** `201 Created`

### `PUT /api/dev/links/:id`

Update an existing link.

### `DELETE /api/dev/links/:id`

Delete a link.

---

## Admin API — Events

Event subscriptions that control user access, device limits, and slot tracking.

### `GET /api/dev/events`

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
    "happ_link": "happ://crypt5/...",
    "is_promo": 0,
    "allow_days": 30
  }
]
```

### `POST /api/dev/events`

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
  "end_date": "2026-04-30T00:00:00",
  "is_promo": false,
  "allow_days": 30
}
```

### `PUT /api/dev/events/:id`

Update an existing event. **Also regenerates** the `happ_link` using the updated `link_id` and existing `event_code`.

### `DELETE /api/dev/events/:id`

Delete an event.

---

## Admin API — Devices

Manages VPN client devices identified by their hardware ID (HWID).

### `GET /api/dev/devices`

List all devices.

### `POST /api/dev/devices`

Pre-register a device (sets `user_type` to `reg`).

**Request Body:**
```json
{
  "hwid": "abc123def456",
  "device_info_os": "Android"
}
```

**Response:** `201 Created`

### `PUT /api/dev/devices/:hwid`

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

### `DELETE /api/dev/devices/:hwid`

Delete / revoke a device.

---

## Admin API — Announcements

Dynamic messages returned to VPN clients via the `announce` response header. Supports both global and event-specific announcements.

### `GET /api/dev/announcements`

List all announcements.

**Response:** `200 OK`
```json
[
  { "key": "normal", "target_event_id": "global", "message": "Welcome!" },
  { "key": "expire", "target_event_id": "global", "message": "Your subscription expires soon." }
]
```

### `PUT /api/dev/announcements`

Bulk update all announcement messages for a specific target event or globally (upsert).

**Request Body:**
```json
{
  "target_event_id": "global",
  "normal": "Welcome to V-Panel VPN!",
  "expire": "⚠️ Your plan expires in 3 days.",
  "renew": "❌ Subscription expired. Contact admin.",
  "limit_device": "Device limit reached for this event.",
  "limit_os": "Your OS is not supported for this event.",
  "wrong_hwid": "Access denied for this device.",
  "miss_hwid": "Missing device identification headers.",
  "no_more_free": "Free trial expired. No more free access.",
  "promo_used": "Promo code already used."
}
```

**Response:** `200 OK`

### `DELETE /api/dev/announcements/:target`

Delete announcements for a specific event target. (Cannot delete `global` announcements).

---

## Admin API — WARP

Manages Cloudflare WARP (WireGuard) configs bound to devices.

### `GET /api/dev/warp`

List all WARP configs joined with device info.

### `GET /api/dev/warp/settings`

Get global WARP settings.

### `PUT /api/dev/warp/settings`

Update global WARP settings.

### `POST /api/dev/warp/generate`

Generate a new WARP config for a device.

### `POST /api/dev/warp/regenerate/:hwid`

Regenerate WARP config for a device.

### `PUT /api/dev/warp/:hwid`

Edit a WARP config's structured fields.

### `PATCH /api/dev/warp/:hwid`

Toggle per-device auto mode.

**Request Body:**
```json
{ "auto_mode": true }
```

### `DELETE /api/dev/warp/:hwid`

Delete a WARP config.

---

## External API — Devices

Read and interact with device states safely from external sources. Uses `EXTERNAL_API_TOKEN` for `Bearer` authentication.

### `GET /api/external/devices/:hardware_id`

Read-only endpoint to get device status and linked event information.
Maps `hardware_id` to `hwid`, and `os_platform` to `device_info_os`.

**Response:** `200 OK`
```json
{
  "hardware_id": "abc123def456",
  "os_platform": "Android",
  "expire_date": "2026-06-10T00:00:00Z",
  "event_name": "Pro Subscription",
  "event_expire_date": "2026-12-31T00:00:00Z",
  "is_promo": false,
  "is_active": true
}
```

### `POST /api/external/devices/pre-register`

Write-only endpoint to pre-register a device with no event assigned. This behaves like an `INSERT OR IGNORE`, handling duplicate pre-registrations gracefully and returning the existing device information without an error if it's already recorded.

**Request Body:**
```json
{
  "hardware_id": "abc123def456",
  "os_platform": "Android"
}
```

**Response:** `201 Created` (or `200 OK` if already exists)
```json
{
  "message": "Device pre-registered successfully",
  "device": {
    "hardware_id": "abc123def456",
    "os_platform": "Android",
    "expire_date": null,
    "event_id": null
  }
}
```

---

## Reseller API — Device Upgrade

Endpoints for third-party bots to provision and upgrade devices to paid events. Uses `EXTERNAL_API_TOKEN` for `Bearer` authentication.

### `POST /api/reseller/devices/:hardware_id/upgrade`

Provisions or upgrades a device by assigning it to a paid event identified by `event_id`. This is a **1-step upsert process** — no pre-registration is required. If the device does not exist, it is automatically created. If it already exists, its subscription is extended.

**Authentication:**

| Header          | Value                           |
|-----------------|---------------------------------|
| `Authorization` | `Bearer <EXTERNAL_API_TOKEN>`   |

**URL Parameters:**

| Parameter     | Type   | Required | Description                    |
|---------------|--------|----------|--------------------------------|
| `hardware_id` | string | ✅       | The hardware ID of the device  |

**Request Body:**

```json
{
  "event_id": "550e8400-e29b-41d4-a716-446655440000",
  "days": 30
}
```

| Field      | Type    | Required | Description                          |
|------------|---------|----------|--------------------------------------|
| `event_id` | string  | ✅       | UUID of the paid event to assign     |
| `days`     | integer | ✅       | Number of days to add to the subscription. **Only accepts `30` or `90`.** |

**Expiration Stacking Logic:**

| Device State                          | Expiry Calculation                        |
|---------------------------------------|-------------------------------------------|
| New device                            | `now + days`                              |
| Existing, expired                     | `now + days`                              |
| Existing, active + **same event**     | `current_expire_date + days` (stacks)     |
| Existing, active + **different event**| `now + days` (resets)                     |

**Success Response:** `200 OK`

```json
{
  "message": "Device upgraded successfully",
  "created": false,
  "device": {
    "hardware_id": "abc123def456",
    "event_id": "550e8400-e29b-41d4-a716-446655440000",
    "user_type": "paid",
    "expire_date": "2026-08-12T00:00:00Z"
  }
}
```

| Field     | Type    | Description                                      |
|-----------|---------|--------------------------------------------------|
| `created` | boolean | `true` if the device was newly created, `false` if it was updated |

> `user_type` is always set to `"paid"` regardless of the device's previous state.

**Error Responses:**

| Status | Condition                                      | Response Body                              |
|--------|------------------------------------------------|--------------------------------------------|
| `400`  | `event_id` or `days` is missing, `days` is not `30` or `90`, or request body is invalid JSON | `{ "error": "..." }`     |
| `401`  | Token is missing or incorrect                  | `{ "error": "Unauthorized" }`              |
| `404`  | Event with the given `event_id` does not exist | `{ "error": "Event not found" }`           |
| `503`  | `EXTERNAL_API_TOKEN` is not configured on the server | `{ "error": "..." }`                  |

**Provisioning Workflow:**

A third-party bot calls this single endpoint to provision a user. The server handles device creation and event assignment atomically:

```bash
curl -X POST "https://v-panel.serverbyhtet.workers.dev/api/reseller/devices/device-hwid-001/upgrade" \
  -H "Authorization: Bearer YOUR_EXTERNAL_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"event_id": "550e8400-e29b-41d4-a716-446655440000", "days": 30}'
```

---

## External Integration — Happ Crypto API

The system integrates with an external encryption service to generate `happ://` deep links.

### When It's Called

| Trigger                     | Endpoint Called                          |
|-----------------------------|------------------------------------------|
| Creating a new event (POST) | `https://crypto.happ.su/api-v2.php`      |
| Updating an event (PUT)     | `https://crypto.happ.su/api-v2.php`      |

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
| `promo_used`    | Promo code already used by this device                     |

---

## Database Schema

### `configs`
| Column | Type    | Description           |
|--------|---------|-----------------------|
| id     | INTEGER | Auto-increment PK     |
| name   | TEXT    | Config display name   |
| node   | TEXT    | VLESS/Trojan URI      |
| position | INTEGER | Ordering position default 0 |

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
| is_promo     | BOOLEAN  | Whether it is a promo event (0/1) |
| allow_days   | INTEGER  | Promo validity days (default 30)  |

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
| has_used_promo   | BOOLEAN  | If device has used a promo (0/1)|

### `announcements`
| Column          | Type | Description                         |
|-----------------|------|-------------------------------------|
| key             | TEXT | Announcement key (PK part 1)        |
| target_event_id | TEXT | 'global' or event UUID (PK part 2)  |
| message         | TEXT | Message text                        |

### `proxies`
| Column     | Type     | Description                     |
|------------|----------|---------------------------------|
| id         | INTEGER  | Auto-increment PK               |
| name       | TEXT     | Proxy name                      |
| url        | TEXT     | Proxy URL                       |
| is_active  | BOOLEAN  | 1 or 0 (default 1)              |
| created_at | DATETIME | Timestamp                       |

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
