# Update Request: Migration to Event-Driven Subscription System

Act as an expert Full-Stack Developer specializing in Cloudflare Workers and Hono. We are refactoring our existing VPN Admin Panel to an "Event-Driven" architecture. The previous logic heavily relied on generating multiple links. Now, we will use a single/few base Links and control access via **Events** and encrypted **Event Codes**.

Please read the following logic very carefully and implement step-by-step.

### 1. Database Schema Updates (Cloudflare D1)
Refactor the SQL schema and implement migrations for the following:

- **`links` table changes:** - REMOVE `link_type`, `user_limit`, and `user_type`.
  - ADD `remark` (string) -> Note the link name in the UI.
  - ADD `custom_parameters` (text) -> This will store custom header lines (e.g., `profile-title: my VPN`) that are prepended to the configs string before Base64 encoding.
- **`events` table (NEW):**
  - Columns: `id` (PK), `name` (string), `event_type` (Enum: 'limited', 'hwid'), `remark` (string), `link_id` (FK to links), `allowed_user` (int, 0 means unlimited for HWID), `user_type` (Enum: 'free', 'paid', 'promo'), `allowed_os` (Enum: 'all', 'Android', 'iOS', 'Mac', 'Windows'), `start_date`, `end_date`, `event_code` (string - encrypted payload).
- **`announcements` table (NEW):**
  - Store key-value pairs for messages. 
  - Keys must strictly be: `normal`, `expire`, `renew`, `limit_device`, `limit_os`, `wrong_hwid`, `miss_hwid`, `no_more_free`.
- **`devices` table changes:**
  - Ensure it tracks which events a free user has joined to prevent multiple free event registrations.

### 2. Event Code Generation (Short Secure Token approach)
Instead of encrypting a large payload into the URL (which makes it too long), we will use a stateful token-based approach:
- When creating an Event, generate a short, cryptographically secure random string for the `event_code` (e.g., a 10-12 character alphanumeric string using `crypto.getRandomValues()` and converting to Base62/Hex, or use a lightweight NanoID).
- Store this short `event_code` in the `events` table.
- The subscription URL will simply be: `https://<domain>/sub/:uuid?event_code=<short_random_string>`.
- **Validation:** When a request comes in, query the `events` table using the provided `event_code`. From the database result, retrieve the rules (`link_id`, `user_type`, `allowed_user`, `allowed_os`) to perform the validations in Step 4. This ensures maximum security with a very short URL.

### 3. Frontend UI Updates
- **Links Tab:** Add a multi-line Textarea for `custom_parameters` (e.g., `profile-title: ...`) above the configs multi-select box.
- **Events Tab (NEW):** A UI to create/manage events and automatically generate the `event_link` (`https://<domain>/sub/:uuid?event_code=<encrypted_code>`).
- **Announce Tab (NEW):** A simple UI to edit the string texts for the 8 specific announce keys.

### 4. Core Workflow & Validation Logic (The Engine)
When a client requests the subscription URL (e.g., `/sub/:uuid?event_code=...`), execute this STRICT flow:

**Step A: Header Extraction**
- Extract `HWID` and `OS` (Platform) from the client app's request headers.
- *Condition:* If `HWID` or `OS` is missing -> Return **Blank Configs** + Announce: `miss_hwid`.

**Step B: Event & Device Validation**
- Decrypt/Verify the `event_code`. 
- Check if the HWID exists in the `devices` database.
- **If it is a NEW Device:**
  1. Check `allowed_os`: If OS doesn't match -> Return Blank Configs + Announce: `limit_os`.
  2. Check `allowed_user`: If current user count for this event >= limit -> Return Blank Configs + Announce: `limit_device`.
  3. Check `event_type`: If it's an 'hwid' event (meaning pre-registered HWIDs only) -> Reject new device -> Return Blank Configs + Announce: `wrong_hwid`.
  4. Check `user_type`: If event is 'free', check if this HWID is already registered to *another* free event. If yes -> Return Blank Configs + Announce: `no_more_free`.
  5. *Success:* Register the new device. Set `user_type` same as event's `user_type`. Set `expire_date` to (Current Date + 30 Days) by default.

**Step C: Status Check & Header Injection**
- Check the device's `expire_date` vs Current Date.
  - If Expired -> Return **Blank Configs** + Announce: `renew`.
  - If Expiring within 3 days (<= 72 hours) -> Return **Configs** + Announce: `expire`.
  - If Active/Normal -> Return **Configs** + Announce: `normal`.

### 5. Payload Generation Rules
On *every single request*, dynamically generate the response:
- **Headers REQUIRED:** - `subscription-userinfo`: calculate `expire=...` timestamp based on the device's `expire_date`.
  - Custom `announce` headers mapped to the text configured in the Announcements database.
- **Body / Configs:**
  - If the user is rejected in Step B or Expired in Step C -> Send empty string (or Base64 of empty string).
  - If allowed -> Prepend the `custom_parameters` from the Link, append the `\n` separated `configs`, encode everything to Base64, and return it.

### Addendum: Simplified Event User Tracking & Dashboard

*Note: We are using a strict, one-time slot reservation system. Once a user joins an event, they permanently occupy a slot regardless of their expiration status.*

**1. Database Schema Updates**
- **`events` table:** - Add `joined_users` (Integer, default 0). 
- **`devices` table:**
  - Add `current_event_id` (FK to events).

**2. Device Tracking Logic**
- **On New Device Registration:** - When a new device successfully validates and joins an event, INSERT into `devices` with `current_event_id`.
  - UPDATE the `events` table: Increment `joined_users` by +1.

**3. Event Limit Validation Update**
- In **Step B** of the Core Validation Logic, when checking `allowed_user`: 
  - Compare the limit against `joined_users`. 
  - If `joined_users >= allowed_user`, reject the new user (Return Blank Configs + Announce: `limit_device`). 
  - *Crucial:* Do not decrement `joined_users` under any circumstances (even if a user expires). A slot once taken is permanently taken for that event.

**4. Dashboard UI Requirements**
- The **Dashboard** must fetch and display simple statistics for each Event.
- Show a table or cards for Events displaying: 
  - Event Name
  - Capacity (`allowed_user`)
  - Registered Users (`joined_users`)
  - Status (e.g., "Full" if joined_users == allowed_user, else "Open")

### Addendum 2: Admin Manual Device Registration (Pre-binding)

For HWID-restricted events, the admin needs the ability to manually pre-bind devices before the user connects.

**1. Database Schema Updates**
- **`devices` table:** - Update the `user_type` Enum to include `'Reg'`. (Enum: 'free', 'paid', 'promo', 'Reg').
  - Ensure `current_event_id` can be NULL (for pre-registered devices that haven't formally joined a specific event yet, though they might be intended for one).

**2. Admin UI & API Updates (Devices Tab)**
- Add an "Add Device" button and form in the Devices tab.
- **Fields:** HWID (input), OS (dropdown: Android, iOS, Mac, Windows).
- **Admin API Endpoint (`POST /api/devices`):**
  - When the admin submits the form, first query the `devices` table by HWID.
  - **Conflict Check:** If the HWID already exists, fetch its current `user_type` and the linked Event Name (join with `events` table via `current_event_id`). 
  - Return an error response (e.g., 409 Conflict): `"Already registered! This device is currently marked as [user_type] and joined to event: [Event Name]."`. The UI must display this exact notification to the admin.
  - **Success:** If it does not exist, insert the new device with `user_type = 'Reg'` and default `expire_date` (or leave as NULL/dummy date until they actually connect).

**3. Core Validation Logic Update (The `/sub` Endpoint)**
- Update **Step B** (Event & Device Validation) to handle pre-registered devices smoothly.
- When an HWID request comes in and the device *already exists* in the database:
  - Check if its current `user_type` is `'reg'`.
  - If it is `'reg'`, treat it as a valid pre-registered device.
  - Run the standard validations (OS check, user limit check, etc.).
  - **State Transition:** Once validated against the event, UPDATE the device's `user_type` to match the event's `user_type` (e.g., from `'reg'` to `'paid'`), update its `current_event_id` to this event, set the `expire_date` (e.g., Current Date + 30 Days), and increment the event's `joined_users` by +1.
  - *Note:* If the event type is 'hwid' (meaning it strictly requires pre-registration), ONLY devices that already exist in the database (either as 'reg' or already part of the event) are allowed to connect. New unknown devices must be rejected with `wrong_hwid`.