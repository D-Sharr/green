# Update: Myanmar Time (MMT) Standardization & Dynamic Expiry Announcement

We need to fix timezone handling and add a dynamic time-remaining feature for expiring users.

### 1. Myanmar Time (MMT / UTC+6:30) Standardization
Cloudflare Workers default to UTC. Since the Admin Panel inputs and database store datetimes in Myanmar Time (MMT), all backend time calculations must correctly account for the `+06:30` offset.
- **Current Time:** Whenever you get the current time (e.g., `const now = new Date()`), ensure it is evaluated against MMT. 
- **DB Parsing:** When parsing `device.expire_date` from the database, ensure it is treated as an MMT datetime (e.g., appending `+06:30` before parsing if the DB string lacks timezone info, or using a robust offset calculation).

### 2. Dynamic `%time%` Placeholder in Announcements
When a user is within the 72-hour expiration window, the system returns the `expire` announcement. 
- If the `expire` announcement string from the database contains the exact placeholder `%time%`, the backend must dynamically calculate the remaining time and replace the placeholder.
- **Calculation Logic:**
  1. Calculate the difference: `remaining_ms = device_expire_date_mmt - current_date_mmt`
  2. Convert to hours: `const diffHours = Math.ceil(remaining_ms / (1000 * 60 * 60))`
  3. Format the string: 
     - If `diffHours > 1`: return `diffHours + " Hours"`
     - If `diffHours === 1`: return `"1 Hour"`
     - If `diffHours <= 0`: (This shouldn't happen here as they would be fully expired, but fallback to `"0 Hours"` or just let the `renew` logic catch it).
- **Replacement:** `const finalAnnounce = announceString.replace('%time%', formattedTime);`
- Apply this `finalAnnounce` to the `announce` response header.

### Note:
Ensure this dynamic replacement logic does not break other announcement keys (`normal`, `miss_hwid`, etc.), and only attempts replacement if the placeholder `%time%` actually exists in the string.