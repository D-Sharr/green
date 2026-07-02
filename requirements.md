Act as an expert Full-Stack Developer specializing in Cloudflare Workers, Cloudflare D1 Database, and Frontend UI development (HTML/JS/Tailwind). I need you to build a comprehensive Web Admin Panel for managing VPN subscriptions (specifically for Happ or v2RayTun).

Here are the strict requirements for the project:

### 1. Technology Stack & Security
- **Backend:** Cloudflare Workers (using Hono.js for routing is highly preferred).
- **Database:** Cloudflare D1.
- **Frontend:** Responsive Web App with a mobile-app-like Sidebar Menu. Use Tailwind CSS for styling.
- **Security:** - Implement robust API security.
  - Create Authentication Middleware using Bearer Tokens to protect admin API routes.
  - Validate device limits and expiration dates on every subscription request.

### 2. Database Schema (Cloudflare D1)
Please write the exact SQL statements to create the following tables:
- `configs`: id (PK), name, node (string).
- `links`: id (UUID, PK), link_type (Enum: 'limited', 'hwid'), user_type, user_limit (integer, default 1 for hwid, custom for limited), combined_configs (text).
- `devices`: hwid (PK), device_info_os (string), link_id (FK to links), first_date, expire_date, user_type (Enum: 'free', 'paid', 'promo').

### 3. Frontend Admin Panel UI
Create a responsive UI with a mobile-app-style Sidebar Menu containing the following tabs:
- **Dashboard:** Overview statistics.
- **Configs:** CRUD operations for `configs` (id, name, node).
- **Links:** - Must have two sub-tabs: 'Limited Links' and 'HWID Links'.
  - UI must allow Multi-Selecting existing `configs`.
  - When configs are selected, join their `node` strings with a newline character (`\n`), Base64 encode the combined string, and save/attach it to the generated link.
  - Generate a UUID for the subscription link based on user type, link type, and user limit.
- **Devices (HWID):** CRUD operations and view for `devices` data.

### 4. Subscription Link API Logic & Headers
- **Endpoint Structure:** The subscription URL should look like `https://<worker-domain>/sub/:uuid`. If it is an HWID link, it will be accessed as `https://<worker-domain>/sub/:uuid?hwid=<device_hwid>`.
- **Validation & HWID Handling:**
  - When a request hits the endpoint, verify the UUID.
  - If `link_type` is 'hwid', extract the `?hwid=` query parameter.
  - Fetch the HWID and Device Type (Platform/OS) sent from the Happ or v2RayTun client. Check if the HWID exists in the `devices` table and if it respects the device limit and expiration date.
  - If valid, update or store the device info.
- **Response Headers:**
  - The server must return the Base64 encoded configs.
  - Automatically inject required headers dynamically tied to the device/link info:
    - `subscription-userinfo`: calculate and set the `expire=` parameter based on the device's `expire_date`.
    - Provide custom `announce` parameters or any related standard v2ray subscription headers based on the link info.

Please provide the complete solution including:
1. D1 Database schema (SQL).
2. The Cloudflare Worker code (Hono router, Middlewares, API endpoints, Base64 logic).
3. The Frontend HTML/JS code (can be served directly from the Worker or as a static structure).