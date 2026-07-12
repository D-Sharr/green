# V-Panel — Features & Tasks

> Auto-generated from a code review of the `v-panel` Cloudflare Workers VPN subscription panel.
> Source of truth: the actual code in `src/` (not `API_DOCUMENTATION.md`, which is stale).

---

## Overview

**V-Panel** is a Cloudflare Workers (Hono + D1) backend that manages VPN subscription links for Happ / v2RayTun clients. It uses an **event-driven** architecture: base **Links** carry the raw config payload, **Events** attach access rules (user type, OS, slots, expiry) and produce short encrypted **Event Codes**, and **Devices** are tracked by HWID with per-event join rules.

| Aspect | Value |
|---|---|
| Runtime | Cloudflare Workers (`wrangler dev` / `deploy`) |
| Framework | Hono v4 (`hono`) |
| Database | Cloudflare D1 (`green-db`) |
| Language | TypeScript (single-file UI templates as template-literal HTML) |
| Bindings | `DB`, `ADMIN_TOKEN`, `EXTERNAL_API_TOKEN`, `EVENT_SECRET` (unused) |
| Public UI | `GET /` (camouflage weather app), `GET /dev` (admin panel), `GET /sub/:uuid` (subscription + browser decoy) |

---

## Architecture & Tech Stack

- **Backend** — Hono router on Cloudflare Workers. Two protected API surfaces:
  - `/api/dev/*` — admin API, guarded by Bearer `ADMIN_TOKEN` (via `hono/bearer-auth`).
  - `/api/external/*` — third-party API, guarded by a separate Bearer `EXTERNAL_API_TOKEN` (custom middleware, isolated from admin token).
- **Database** — Cloudflare D1 (SQLite). 6 tables: `configs`, `links`, `events`, `announcements`, `devices`, `proxies`.
- **Frontend** — Server-rendered HTML templates (`admin-ui.ts`, `landing-ui.ts`, `postcard-ui.ts`). The admin panel is a dark-themed SPA using TailwindCSS (CDN), Font Awesome, and `fetch` calls to `/api/dev/*` with Bearer auth stored in `localStorage`.
- **External integration** — Happ Crypto API (`https://crypto.happ.su/api-v2.php`) encrypts subscription URLs into `happ://` links.
- **No background workers** — no `scheduled` handler, no cron, no queues. Expiry/renewal is computed on-demand per request.

---

## Database Schema

Defined in `schema.sql` + 3 migration files.

### `configs`
VPN node definitions used to build subscription payloads.

| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PK | autoincrement |
| `name` | TEXT | display name |
| `node` | TEXT | VLESS/Trojan URI |
| `position` | INTEGER | drag-drop ordering (added in `migration3.sql`, lazily `ALTER TABLE` at runtime) |

### `links`
Base subscription link definitions. Referenced by events and devices.

| Column | Type | Notes |
|---|---|---|
| `id` | TEXT PK | UUID (client-generated) |
| `remark` | TEXT | admin note |
| `custom_parameters` | TEXT | custom header lines prepended to configs before base64 |
| `combined_configs` | TEXT | `\n`-joined `node` values from selected configs |

### `events`
Promotional/access events that attach rules to a base link.

| Column | Type | Notes |
|---|---|---|
| `id` | TEXT PK | UUID |
| `name` | TEXT | event name (also used as `profile-title`) |
| `event_type` | TEXT | `limited` or `hwid` |
| `remark` | TEXT | |
| `link_id` | TEXT FK→links | `ON DELETE CASCADE` |
| `allowed_user` | INTEGER | slot limit; `0` = unlimited |
| `joined_users` | INTEGER | live count via subquery (not maintained by a job) |
| `user_type` | TEXT | `free` / `paid` / `promo` |
| `allowed_os` | TEXT | `all` / `Android` / `iOS` / `Mac` / `Windows` |
| `start_date` / `end_date` | DATETIME | MMT (+06:30) |
| `event_code` | TEXT | 12-char hex, crypto-random |
| `happ_link` | TEXT | encrypted `happ://` link (nullable) |
| `is_promo` | BOOLEAN | promo event flag (`migration.sql`) |
| `allow_days` | INTEGER | expiry window; default 30 (`migration.sql`) |

### `announcements`
Message overrides, per-event or global.

| Column | Type | Notes |
|---|---|---|
| `key` | TEXT | enum: `normal`, `expire`, `renew`, `limit_device`, `limit_os`, `wrong_hwid`, `miss_hwid`, `no_more_free`, `promo_used` |
| `target_event_id` | TEXT | defaults to `'global'` (`migration2.sql` enabled per-event) |
| `message` | TEXT | supports `%time%` placeholder |

Composite PK: `(key, target_event_id)`.

### `devices`
Registered client devices, tracked by HWID.

| Column | Type | Notes |
|---|---|---|
| `hwid` | TEXT PK | hardware ID from client headers |
| `device_info_os` | TEXT | OS reported by client |
| `link_id` | TEXT FK→links | resolved from assigned event |
| `event_id` | TEXT FK→events | `ON DELETE SET NULL` |
| `current_event_id` | TEXT FK→events | event currently joined |
| `first_date` | DATETIME | auto `CURRENT_TIMESTAMP` |
| `expire_date` | DATETIME | MMT; set on join = now + `allow_days` |
| `user_type` | TEXT | `free` / `paid` / `promo` / `reg` |
| `has_used_promo` | BOOLEAN | added in `migration.sql` (see task T4) |

### `proxies`
Anti-ISP proxy domains for link generation.

| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PK | |
| `name` | TEXT | e.g. "Vercel 1" |
| `url` | TEXT | `https://...` (trailing slash stripped on insert) |
| `is_active` | BOOLEAN | default 1 |
| `created_at` | DATETIME | auto |

### Migrations
- `migration.sql` — adds `is_promo`, `allow_days`, `announcement_text` (later dropped), `has_used_promo`; adds `promo_used` announcement key.
- `migration2.sql` — drops `events.announcement_text`; recreates `announcements` with composite PK `(key, target_event_id)` for per-event messages.
- `migration3.sql` — adds `configs.position` for drag-drop ordering.

---

## Implemented Features

### 1. Admin Panel (`GET /dev` → `admin-ui.ts`)
A dark-themed SPA with a collapsible sidebar and 7 tabs. Auth via Bearer token stored in `localStorage` (`vpanel_token`); auto-logout on any `401`.

**Cross-cutting UI:**
- Login overlay (password input tested against `GET /configs`).
- `apiFetch()` wrapper with Bearer auth + JSON content type.
- `showToast()` notifications (3s auto-hide).
- Modals, drag-and-drop rows, search, spinners, `confirm()` on deletes, clipboard copy.

**Tab: Dashboard**
- Stat cards: total configs, active links, connected devices.
- Event slot tracker: per-event card with name, user type, OS, slots taken (`joined_users`/`allowed_user` or `∞`), progress bar, OPEN/FULL badge.
- Happ link copy button (violet; turns emerald "Copied!" on success).

**Tab: Configs**
- Table: Position | ID | Name | Node | Actions.
- Create / edit / delete.
- Drag-and-drop reorder + up/down chevrons → `PUT /configs/reorder`.

**Tab: Links**
- Table: ID (truncated UUID) | Remark | Actions.
- Create / edit / delete (warns "Users bound to this will lose access").
- Modal: remark, custom parameters textarea, checkbox multi-select of configs.
- Default custom params pre-filled: `profile-web-page-url` + `support-url` (Telegram).
- `combined_configs` = selected `node` values joined by `\n`.

**Tab: Devices**
- Search by HWID (live filter), add device, refresh.
- Table: HWID | Event | OS | Type (+ gift icon if `has_used_promo`) | First Seen | Expiry (red if expired) | Actions.
- Pre-register device (`POST /devices`, `user_type='reg'`); `409` conflict shows server message.
- Edit device: user type, assigned event, OS, expire date.
- Delete / revoke.

**Tab: Events**
- Global proxy `<select>` (default origin + active proxies) for event URL generation.
- Table: Name (+promo badge +allow-days) | Type | Event URL (click-to-copy) | Limit | Actions.
- Create / edit / delete (warns "Active users matching this may fail renewal").
- Modal fields: name, base link, event type (`limited`/`hwid`), user type (`free`/`paid`/`promo`), allowed OS, device limit (`0`=unlimited), start/end date, allow days (default 30), is-promo checkbox, remark.
- `copyEventUrl()` builds `${proxy||origin}/sub/${linkId}?event_code=${eventCode}`.

**Tab: Announcements**
- "App Announcements Engine". Create Target Set.
- Table grouped by `target_event_id` (Global badge indigo / Event badge emerald).
- Upsert a set of 9 keys per target; global cannot be deleted; event-specific sets can.
- Dynamic field grid, one text input per announcement key.

**Tab: Proxies**
- "Proxy Domains (Anti-ISP Blocking)".
- Table: Name | URL | Status (Active/Inactive) | Actions.
- Create / edit / delete / toggle active.
- Any mutation refreshes the Events-page proxy dropdown (preserving selection).

### 2. Subscription Engine (`GET /sub/:uuid` → `src/index.ts`)
The core endpoint. Detects browsers vs. VPN clients via `User-Agent`/`Accept`:
- **Browser** → returns `postcardHtmlTemplate` (decoy, see Camouflage).
- **VPN client** → runs the join/validation flow and returns a base64 config payload.

**Auth / inputs:**
- Path `:uuid` = link ID.
- Query `event_code` (required, 12-char hex).
- Headers: `x-hwid`/`hwid`, `x-device-os`/`x-app-os`/`os`.

**Validation flow (always returns `200 OK`, rejections return empty base64 + an `announce` header):**
1. Missing `event_code` / invalid event / UUID mismatch → `limit_device` + empty.
2. Missing HWID or OS → `miss_hwid` + empty.
3. Device already on another event cannot join a `free` event → `no_more_free`.
4. Expired `promo` device cannot join a different `free`/`promo` event → `promo_used`.
5. `reg`/`free`/`promo` device cannot join `paid` event → `wrong_hwid`.
6. Strict `hwid` event: device must already be pre-bound to this exact event, else `wrong_hwid`.
7. Promo re-use blocked for devices already on a promo event.
8. Allowed-OS check (must match device OS unless `all`) → `limit_os`.
9. Slot-limit check (`COUNT devices.current_event_id = event_id >= allowed_user`) → `limit_device`.
10. End-date passed → empty + `limit_device`.
11. All pass → INSERT new device or UPDATE existing; set `expire_date = now + allow_days` (default 30).

**Status / expiry logic (MMT +06:30):**
- Remaining hours ≤ 0 → `renew` + empty.
- Remaining hours ≤ 72 → `expire` (+ configs).
- Otherwise → `normal` (+ configs).

**Announcement resolution:** `getAnnounceText(key, eventId)` tries event-specific message, falls back to `global`; applies `%time%` substitution formatted as "X Hours" / "1 Hour" / "0 Hours"; output base64-encoded.

**Response headers:** `Content-Type`, `profile-update-interval: 1`, `update-always: true`, `announce` (base64), `profile-title` (base64 of event name), `subscription-userinfo` (with `expire=<unix>` when device has expire date).

**Payload:** base64 of `custom_parameters` + `\n`-joined `combined_configs`.

### 3. Announcements
- 9 keys: `normal`, `expire`, `renew`, `limit_device`, `limit_os`, `wrong_hwid`, `miss_hwid`, `no_more_free`, `promo_used`.
- Per-event overrides with global fallback (composite PK `key`+`target_event_id`).
- Batch upsert via `INSERT ... ON CONFLICT DO UPDATE`.
- `%time%` dynamic placeholder (MMT-aware).
- Global set cannot be deleted; event-specific sets can.

### 4. Promo Feature (via migrations, beyond original requirements)
- `events.is_promo` flag + `allow_days` (custom expiry window, default 30).
- `devices.has_used_promo` flag (declared but see task T4).
- `promo_used` announcement key for expired promo devices trying to rejoin.
- Promo re-use blocked for devices already on a promo event.

### 5. Proxies (Anti-ISP Blocking)
- CRUD for proxy domains.
- Active/inactive toggle.
- Active proxies populate the Events-page dropdown; selected proxy URL replaces origin in generated event URLs.
- `GET /proxies/active` returns only `is_active = 1`.

### 6. External API (`/api/external/*`)
Separate Bearer auth (`EXTERNAL_API_TOKEN`), isolated from admin token. Returns `503` if token unconfigured, `401` on mismatch.

- `GET /api/external/devices/:hardware_id` — read-only device status with joined event info; computes `is_active` from `expire_date` (MMT); maps fields (`hardware_id`↔`hwid`, `os_platform`↔`device_info_os`).
- `POST /api/external/devices/pre-register` — race-safe pre-register via `INSERT OR IGNORE`; returns existing device if already present.

### 7. Reseller API (`/api/reseller/*`)
Third-party bot provisioning endpoint that creates or upgrades devices to paid events in a **single step** (upsert). Reuses `EXTERNAL_API_TOKEN` for Bearer authentication.

- `POST /api/reseller/devices/:hardware_id/upgrade` — provisions or upgrades a device by assigning it to a paid event; requires `{ "event_id": "<uuid>", "days": <30|90> }` in the request body (`days` only accepts `30` or `90`); returns `200` with device details and a `created` boolean (`true` = newly created, `false` = updated) on success; `user_type` is always set to `"paid"`; `400`/`401`/`404`/`503` on error.
- **1-step upsert flow:** no pre-registration needed. If the device does not exist, it is created automatically.
- **Smart expiration stacking:**
  - New device → `now + days`
  - Existing, expired → `now + days`
  - Existing, active + **same event** → `current_expire_date + days` (stacks)
  - Existing, active + **different event** → `now + days` (resets)
- **Admin UI addition:** "Copy Event ID" button (fingerprint icon) added to the Events table so admins can easily copy an event's UUID for bot configuration.

### 8. Happ Crypto Integration
- `POST https://crypto.happ.su/api-v2.php` with `{ url }` → `{ encrypted_link }`.
- Triggered on event create (`POST /events`) and update (`PUT /events/:id`).
- Wraps the worker's own `/sub/:uuid?event_code=...` URL into a `happ://crypt5/...` link stored as `events.happ_link`.
- Non-fatal: event creation succeeds even if Happ fails (`happ_link` saved as null, errors logged).

### 9. Camouflage Pages
- **`landing-ui.ts` (`GET /`)** — fake "SkyWatch Pro" weather app (dark night-sky theme, 100 twinkling stars, shooting stars, hardcoded weather). No VPN logic; pure decoy front door.
- **`postcard-ui.ts` (`GET /sub/:uuid` browser branch)** — "Happy Chinese New Year" greeting card (red/gold, lanterns, dragon, sparkles) shown to humans who open a subscription link in a browser instead of returning raw config.

---

## API Reference (actual code)

### Admin API — `/api/dev/*` (Bearer `ADMIN_TOKEN`)

| Method | Path | Description |
|---|---|---|
| GET | `/api/dev/proxies` | List all proxies |
| GET | `/api/dev/proxies/active` | List active proxies only |
| POST | `/api/dev/proxies` | Create proxy |
| PUT | `/api/dev/proxies/:id` | Update proxy |
| DELETE | `/api/dev/proxies/:id` | Delete proxy |
| GET | `/api/dev/configs` | List configs (ordered by position, id) |
| GET | `/api/dev/configs/:id` | Get single config |
| POST | `/api/dev/configs` | Create config (auto position) |
| PUT | `/api/dev/configs/reorder` | Reorder configs by ID array |
| PUT | `/api/dev/configs/:id` | Update config |
| DELETE | `/api/dev/configs/:id` | Delete config |
| GET | `/api/dev/links` | List all links |
| POST | `/api/dev/links` | Create link |
| PUT | `/api/dev/links/:id` | Update link |
| DELETE | `/api/dev/links/:id` | Delete link |
| GET | `/api/dev/events` | List events (with computed `joined_users`) |
| POST | `/api/dev/events` | Create event (+ Happ link) |
| PUT | `/api/dev/events/:id` | Update event (+ Happ link regen) |
| DELETE | `/api/dev/events/:id` | Delete event |
| GET | `/api/dev/announcements` | List all announcements |
| PUT | `/api/dev/announcements` | Upsert announcement set for a target event |
| DELETE | `/api/dev/announcements/:target` | Delete announcements for an event target (global protected) |
| GET | `/api/dev/devices` | List all devices |
| POST | `/api/dev/devices` | Pre-register device (rejects duplicates with `409`) |
| PUT | `/api/dev/devices/:hwid` | Update device (resolves `link_id` from event) |
| DELETE | `/api/dev/devices/:hwid` | Delete device |

### External API — `/api/external/*` (Bearer `EXTERNAL_API_TOKEN`)

| Method | Path | Description |
|---|---|---|
| GET | `/api/external/devices/:hardware_id` | Device status (read-only, MMT-aware `is_active`) |
| POST | `/api/external/devices/pre-register` | Race-safe pre-register |

### Reseller API — `/api/reseller/*` (Bearer `EXTERNAL_API_TOKEN`)

| Method | Path | Description |
|---|---|---|
| POST | `/api/reseller/devices/:hardware_id/upgrade` | Upsert device to paid event (1-step, requires `days`) |

### Public

| Method | Path | Description |
|---|---|---|
| GET | `/` | Landing camouflage (SkyWatch weather app) |
| GET | `/dev` | Admin panel SPA |
| GET | `/sub/:uuid` | Subscription endpoint (browser→postcard, client→config) |

---

## Tasks / TODO

Discovered during code review. Ordered by priority.

### T1 — Update stale `API_DOCUMENTATION.md` (high)
The docs describe `/api/admin/*` routes, but the code implements `/api/dev/*`. The docs also omit the `/api/dev/proxies*` and `/api/external/*` endpoints and the `promo_used` announcement key. Rewrite `API_DOCUMENTATION.md` to match the actual `/api/dev/*` + `/api/external/*` surface and include the 9th announcement key.

### T2 — Remove or implement unused `EVENT_SECRET` binding (medium)
`EVENT_SECRET` is declared in the env type and `wrangler` config but never referenced in `src/index.ts`. Either wire it into the event-code validation/encryption path or remove the binding to avoid dead config.

### T3 — Remove hardcoded `ADMIN_TOKEN` fallback (high / security)
Admin auth falls back to the literal `"default-secret-token"` when `ADMIN_TOKEN` is unset. Remove the fallback so the middleware rejects all requests if the secret is missing (fail-closed). This prevents an unconfigured deploy from being open to a known default.

### T4 — Reconcile `has_used_promo` column vs `user_type === 'promo'` logic (medium)
The `devices.has_used_promo` column (added in `migration.sql`) exists but the join flow infers promo usage from `user_type === 'promo'` instead. Either use `has_used_promo` as the source of truth (set it on first promo join, check it on re-join) or drop the column. Current state is inconsistent.

### T5 — Add rate limiting on public `GET /sub/:uuid` (medium / security)
The public subscription endpoint has no rate limiting; abuse mitigation relies solely on HWID/slot rules. Add a lightweight rate limiter (e.g. Cloudflare's built-in or a D1-counted limiter) keyed on HWID and/or IP to blunt brute-force and enumeration of `event_code` values.

### T6 — Add CORS middleware if cross-origin access is needed (low)
No CORS middleware is configured. If the admin panel or external API is ever consumed from a different origin (e.g. a separate admin domain or a 3rd-party dashboard), add `hono/cors`. Skip if same-origin-only by design.

### T7 — Replace lazy runtime `ALTER TABLE` for `configs.position` with a clean migration (low)
`GET/POST /configs` and `PUT /configs/reorder` each contain defensive `ALTER TABLE ADD COLUMN position` retry paths because the column is added lazily at runtime. Move this to a one-time migration (already partly in `migration3.sql`) and remove the runtime migration code.

### T8 — Consider a `scheduled` cron vs per-request expiry (low / optional)
Expiry/renewal is computed on every `/sub/:uuid` request. `joined_users` is also computed live via subquery. For scale, consider a `[triggers]` cron in `wrangler.toml` + a `scheduled` handler to precompute expiry flags and maintain `joined_users` as a column. Optional unless throughput grows.

---

## Notes

- `requirements-v3.md` is empty.
- `requirements.md` → `v2` (event-driven refactor) → `v4` (strict user rules + always-200) → `v6` (MMT timezone + `%time%`) form the spec lineage; the promo feature was introduced via migrations, not in the requirements docs.
- Camouflage pages (`landing-ui.ts`, `postcard-ui.ts`) are intentional decoys and contain no VPN logic.
