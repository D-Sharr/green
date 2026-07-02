# Update: Strict User Rules, Expiry Handling, and Header Adjustments

Please update the `/sub/:uuid` validation logic and header generation according to the following strict rules:

### 1. HTTP Status Fix (Never Return 403)
- **CRITICAL:** The `/sub` endpoint must ALWAYS return HTTP Status `200 OK`, even when rejecting a user. 
- VPN clients (like Happ) fail to read response headers if a `403` or `500` status is returned. All rejections must be handled by returning a `200 OK` with an empty string (or Base64 of empty string) for the configs, accompanied by the correct `announce` header.

### 2. Pre-Registered (Reg) Device Logic & Expiry
- Devices with `user_type` == `'Reg'` are **ONLY** allowed to auto-join `free` events.
- If a `'Reg'` device attempts to join a `paid` event -> REJECT (Return Blank Configs + Announce: `wrong_hwid`).
- **Expiry Assignment:** - Only assign the default 30-day expiration (`Current Date + 30 Days`) when a device successfully joins a `free` event.
  - Do NOT auto-assign expiration dates for `paid` events. For paid events, the admin will manually set the `user_type` to 'paid' and manually configure the `expire_date` via the Admin Dashboard UI.

### 3. Cross-Event Type Blocking
- If a device registered as `'free'` tries to access a `'paid'` event link -> REJECT (Return Blank Configs + Announce: `wrong_hwid`).
- If a device registered as `'paid'` tries to access a `'free'` event link -> REJECT (Return Blank Configs + Announce: `wrong_hwid`).

### 4. Expired Free User Permanent Ban
- If a device is `'free'` and its `expire_date` has passed (Expired):
  - Block access to their current free event AND permanently block them from joining any other free events.
  - REJECT (Return Blank Configs + Announce: `no_more_free`).

### 5. Custom Headers (Profile-Title & Announce)
- In the final HTTP response headers returned to the client, you must strictly include:
  1. `announce: <the_determined_status_string>`
  2. `profile-title: <event_name>` (Fetch the `name` of the event from the database and set it as the profile-title header).
  3. `subscription-userinfo: expire=<timestamp>` (Only if the user is successfully validated and active).