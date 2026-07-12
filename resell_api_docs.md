# Reseller API — Bot Integration Guide

> **Base URL:** `https://v-panel.serverbyhtet.workers.dev`
>
> This guide is intended for third-party bot developers who need to provision VPN access for their users.

---

## Overview

The Reseller API allows your bot to provision and upgrade devices to paid events in a **single step**. No pre-registration is required — the endpoint handles device creation and event assignment atomically (upsert logic).

---

## Authentication

All Reseller API endpoints require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <EXTERNAL_API_TOKEN>
```

> The token is the same `EXTERNAL_API_TOKEN` used by the External API. Contact the V-Panel admin to obtain it.

If the token is missing or incorrect, you will receive:

```json
{ "error": "Unauthorized" }
```

**Status:** `401`

---

## Provision / Upgrade a Device

### `POST /api/reseller/devices/:hardware_id/upgrade`

This is a **1-step upsert endpoint**. If the device does not exist, it is created automatically. If it already exists, its subscription is extended.

**Request:**

```bash
curl -X POST "https://v-panel.serverbyhtet.workers.dev/api/reseller/devices/abc123def456/upgrade" \
  -H "Authorization: Bearer YOUR_EXTERNAL_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "event_id": "550e8400-e29b-41d4-a716-446655440000",
    "days": 30
  }'
```

**URL Parameters:**

| Parameter     | Type   | Required | Description                    |
|---------------|--------|----------|--------------------------------|
| `hardware_id` | string | ✅       | The hardware ID of the device  |

**Request Body:**

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

**Response (200 OK):**

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

---

## Error Responses

| Status | Condition                                      | Example Response                           |
|--------|------------------------------------------------|--------------------------------------------|
| `400`  | `event_id` or `days` is missing, `days` is not `30` or `90`, or body is invalid JSON | `{ "error": "event_id is required" }` |
| `401`  | Token is missing or incorrect                  | `{ "error": "Unauthorized" }`              |
| `404`  | Event does not exist                           | `{ "error": "Event not found" }`           |
| `503`  | Server token not configured                    | `{ "error": "API token not configured" }`  |

---

## Complete Workflow Example

```bash
# Single call — creates or upgrades the device
curl -X POST "https://v-panel.serverbyhtet.workers.dev/api/reseller/devices/device-hwid-001/upgrade" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"event_id": "550e8400-e29b-41d4-a716-446655440000", "days": 30}'
```

---

## Getting the Event ID

The `event_id` is a UUID that identifies a paid event in V-Panel. To obtain it:

1. Log in to the V-Panel Admin Dashboard (`GET /dev`).
2. Navigate to the **Events** tab.
3. Click the **Copy Event ID** button (fingerprint icon) next to the desired event.
4. Use this value as the `event_id` in your upgrade requests.

> If you are the bot operator and not the admin, request the `event_id` from the V-Panel administrator.

---

## Important Notes

- **Single step.** No pre-registration is needed. The endpoint creates the device if it does not exist.
- **Smart stacking.** Calling this endpoint on an already-active device **with the same event** extends its expiry by the specified `days`. Upgrading to a **different event** resets the expiry to `now + days`.
- **Same token.** The endpoint uses the `EXTERNAL_API_TOKEN` passed as a Bearer token.
- **Always paid.** Every successful call sets `user_type` to `"paid"`.
