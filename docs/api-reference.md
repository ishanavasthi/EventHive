# 4. API Reference

← [Backend](./backend.md) · [Docs index](./README.md) · Next: [Mobile App](./mobile-app.md)

---

## 4.1 Conventions

**Base URL**

| Environment | URL |
| :--- | :--- |
| Local | `http://localhost:5000/api` |
| Render (deployed) | `https://eventhive-l9j5.onrender.com/api` |

**Authentication.** Protected endpoints require a JWT in a custom header — *not*
`Authorization: Bearer`:

```http
x-auth-token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…
```

Tokens are issued by any of the four sign-in endpoints and are valid for **5 days**.

**Content type.** All request and response bodies are `application/json`, except `500` responses,
which return the plain string `Server Error`.

**Error shapes.** Three distinct shapes are in use:

```jsonc
// express-validator failures
{ "errors": [ { "msg": "Please include a valid email", "param": "email", "location": "body" } ] }

// business-rule rejections and auth failures
{ "msg": "Registrations for this event have closed" }

// unexpected errors  →  plain text, not JSON
Server Error
```

---

## 4.2 Endpoint summary

| # | Method | Path | Auth | Purpose |
| :---: | :--- | :--- | :---: | :--- |
| 1 | `GET` | `/health` | — | Liveness probe |
| 2 | `GET` | `/api/metrics` | — | Process + per-route telemetry |
| 3 | `POST` | `/api/auth/register` | — | Create an account |
| 4 | `POST` | `/api/auth/login` | — | Email/password sign-in |
| 5 | `POST` | `/api/auth/google` | — | Google sign-in |
| 6 | `POST` | `/api/auth/apple` | — | Apple sign-in |
| 7 | `PUT` | `/api/auth/profile` | ✅ | Update profile |
| 8 | `POST` | `/api/events` | ✅ | Create an event |
| 9 | `GET` | `/api/events` | — | List events (optionally paginated) |
| 10 | `GET` | `/api/events/:id` | — | Event detail |
| 11 | `DELETE` | `/api/events/:id` | ✅ host | Cancel an event |
| 12 | `GET` | `/api/events/:id/guests` | ✅ host | Guest list |
| 13 | `POST` | `/api/events/:id/checkin` | ✅ host | Check in by ticket code |
| 14 | `POST` | `/api/bookings/checkout` | ✅ | Create a payment order |
| 15 | `POST` | `/api/bookings/verify` | ✅ | Commit the booking |
| 16 | `GET` | `/api/bookings/my-bookings` | ✅ | The caller's bookings |
| 17 | `GET` | `/api/notifications` | ✅ | The caller's notifications |
| 18 | `PUT` | `/api/notifications/read-all` | ✅ | Mark all read |
| 19 | `PUT` | `/api/notifications/:id/read` | ✅ | Mark one read |

> **Route ordering note.** In `routes/events.js`, `GET /:id` is registered *before* `GET /`. Express
> matches `/api/events` against the `/` route and `/api/events/<id>` against `/:id`, so both resolve
> correctly, but the ordering is worth knowing if new literal sub-paths are added.

---

## 4.3 System

### `GET /health`

Touches no database. Used by the Kubernetes liveness check, by `keep_alive.js` (every 10 minutes,
to prevent Render's free tier sleeping), and as the control endpoint in the load benchmark.

```jsonc
// 200 — 56 bytes
{ "status": "UP", "message": "EventHive Backend is running" }
```

### `GET /api/metrics`

In-process telemetry accumulated since boot. Resets on restart; not aggregated across replicas.

```jsonc
// 200
{
  "system": {
    "uptimeSeconds": 412,
    "uptimeFormatted": "0d 0h 6m 52s",
    "memoryUsage": { "rssMB": 263.03, "heapTotalMB": 71.2, "heapUsedMB": 47.34, "externalMB": 3.1 }
  },
  "requests": {
    "total": 1084,
    "byStatus": { "1xx": 0, "2xx": 1080, "3xx": 0, "4xx": 4, "5xx": 0 }
  },
  "routes": {
    "GET /health":     { "requestCount": 1020, "averageResponseTimeMs": 0.56, "totalResponseTimeMs": 571.2 },
    "GET /api/events": { "requestCount": 64,   "averageResponseTimeMs": 263.74, "totalResponseTimeMs": 16879.36 }
  }
}
```

---

## 4.4 Authentication

### `POST /api/auth/register`

Create an account. Public.

**Request**

```jsonc
{
  "name": "Rohit Sharma",              // required, non-empty
  "email": "rohit@example.com",        // required, valid email, unique
  "password": "rohit123",              // required, min 6 characters
  "userType": "individual",            // optional — "individual" | "organization"
  "city": "Bengaluru",                 // optional — drives city notification fan-out
  "profilePicture": "https://…",       // optional — URL
  "bankDetails": {                     // optional — collected from hosts for payouts
    "accountNumber": "…", "ifscCode": "…", "accountHolderName": "…"
  }
}
```

**Responses**

| Status | Body |
| :--- | :--- |
| `200` | `{ "token": "<jwt>", "user": { …, "password": undefined } }` |
| `400` | `{ "errors": [ { "msg": "Password must be 6 or more characters" } ] }` |
| `400` | `{ "msg": "User already exists" }` |
| `500` | `Server Error` |

The password is hashed with bcrypt (10 salt rounds) and is stripped from the response.

---

### `POST /api/auth/login`

**Request**

```jsonc
{ "email": "rohit@example.com", "password": "rohit123" }
```

**Responses**

| Status | Body |
| :--- | :--- |
| `200` | `{ "token": "<jwt>", "user": { … } }` |
| `400` | `{ "errors": [ { "msg": "Invalid Credentials" } ] }` — same response for unknown email *and* wrong password |
| `500` | `Server error` |

---

### `POST /api/auth/google`

Exchanges a Google `id_token` for an EventHive JWT. Creates the user on first sign-in.

```jsonc
// Request
{ "token": "<google id_token>" }

// 200
{ "token": "<eventhive jwt>", "user": { … } }

// 401
{ "msg": "Google Token Verification Failed" }
```

---

### `POST /api/auth/apple`

Verifies the token against Apple's JWKS (`https://appleid.apple.com/auth/keys`) with `RS256`,
`audience = APPLE_BUNDLE_ID`, `issuer = https://appleid.apple.com`.

```jsonc
// Request
{
  "identityToken": "<apple identityToken>",
  "fullName": { "givenName": "Rohit", "familyName": "Sharma" }   // optional; Apple sends it only on first authorisation
}
```

| Status | Body |
| :--- | :--- |
| `200` | `{ "token": "<jwt>", "user": { … } }` |
| `400` | `{ "msg": "Apple identity token is missing" }` |
| `400` | `{ "msg": "Email not provided in Apple token" }` |
| `401` | `{ "msg": "Apple token verification failed" }` |

When `fullName` is absent, the display name falls back to the email local-part.

---

### `PUT /api/auth/profile` 🔒

Updates the caller's profile. **`name` is deliberately not updatable** through this endpoint.

```jsonc
// Request — all fields optional; only supplied fields are written
{
  "email": "new@example.com",
  "profilePicture": "https://…",
  "city": "Mumbai",
  "bankDetails": { "accountNumber": "…", "ifscCode": "…", "accountHolderName": "…" }
}

// 200 — the updated user document, without `password`
```

`bankDetails` is normalised to a complete object (missing sub-fields become `''`) rather than
partially merged.

---

## 4.5 Events

### `POST /api/events` 🔒

Creates an event owned by the caller.

**Request**

```jsonc
{
  "name": "Neon Beats: Under the Stars",          // required
  "description": "Outdoor EDM festival…",         // required
  "category": "Music",                            // Music|Workshop|Meetup|Sports|Tech|Art|Cultural|Cooking|Other
  "startDate": "2026-09-14T18:00:00.000Z",        // required
  "endDate":   "2026-09-15T00:00:00.000Z",        // required
  "location": {                                   // location.address required
    "address": "Indiranagar Club Grounds, Bengaluru, Karnataka, India",
    "lat": 12.971891, "lng": 77.641151
  },
  "ticketType": "Paid",                           // "Free" | "Paid"
  "price": 799,
  "totalTickets": 250,                            // required unless isExternalTicket
  "isExternalTicket": false,
  "externalTicketUrl": "",
  "poster": "data:image/jpeg;base64,…",           // base64 data URI from the app, or a URL
  "registrationDeadline": "2026-09-13T18:00:00.000Z",   // optional, must be ≤ startDate
  "targetAgeGroup": "21+",                        // All Ages|Kids|Teens|18+|21+
  "videoUrl": "https://…"                         // optional
}
```

**Responses**

| Status | Body |
| :--- | :--- |
| `200` | The created event document |
| `400` | `{ "errors": [ { "msg": "Registration deadline must be before or equal to the event start date" } ] }` |
| `400` | `{ "errors": [ { "msg": "Ticket count is required" } ] }` |
| `400` | `{ "errors": [ { "msg": "Target age group is invalid" } ] }` |
| `401` | `{ "msg": "No token, authorization denied" }` |

**Side effect.** If `location.address` contains one of `New Delhi`, `Mumbai`, `Bengaluru`, `Pune`,
`Hyderabad`, a `general` notification is fanned out to every user whose `city` matches (excluding
the host). A failure here is logged but does **not** fail the request.

**Normalisation applied server-side:** when `isExternalTicket` is true, `price`, `totalTickets` and
`inventory` are forced to `0` and `ticketType` to `'Free'`. `inventory` is always initialised to
`totalTickets`.

---

### `GET /api/events`

Public. Pagination is **opt-in** — both `page` and `limit` must be supplied.

| Query param | Type | Effect |
| :--- | :--- | :--- |
| `page` | integer | 1-based page number |
| `limit` | integer | documents per page |

```bash
GET /api/events                        # every event, every field
GET /api/events?page=1&limit=30        # 30 events, without `description` and `videoUrl`
```

Results are always sorted by `startDate` ascending and have `host` populated with
`name`, `email`, `profilePicture`, `userType`.

```jsonc
// 200
[
  {
    "_id": "6890…",
    "name": "Neon Beats: Under the Stars",
    "category": "Music",
    "startDate": "2026-09-14T18:00:00.000Z",
    "endDate": "2026-09-15T00:00:00.000Z",
    "location": { "address": "Indiranagar Club Grounds, Bengaluru, …", "lat": 12.97, "lng": 77.64 },
    "ticketType": "Paid", "price": 799,
    "totalTickets": 250, "inventory": 242,
    "isExternalTicket": false, "externalTicketUrl": "",
    "poster": "https://images.unsplash.com/…",
    "registrationDeadline": "2026-09-13T18:00:00.000Z",
    "targetAgeGroup": "21+",
    "host": { "_id": "6890…", "name": "Rohit Sharma", "email": "rohit@example.com",
              "profilePicture": "https://…", "userType": "individual" },
    "createdAt": "2026-08-20T09:12:00.000Z"
  }
]
```

> **Performance.** The paginated projection removes `description` and `videoUrl` but retains
> `poster`, which may be a multi-hundred-kilobyte base64 data URI for app-created events. See
> [Testing §6.4](./testing-and-performance.md#641-bottleneck-analysis).

---

### `GET /api/events/:id`

Public. Returns the full document with `host` populated.

| Status | Body |
| :--- | :--- |
| `200` | The event document |
| `404` | `{ "msg": "Event not found" }` — also returned for a malformed `ObjectId` |

---

### `DELETE /api/events/:id` 🔒 host only

| Status | Body |
| :--- | :--- |
| `200` | `{ "msg": "Event removed" }` |
| `401` | `{ "msg": "User not authorized" }` |
| `404` | `{ "msg": "Event not found" }` |

**Side effect.** Every user with a `Confirmed` booking receives an `event_cancelled` notification
*before* the event is deleted. Bookings themselves are **not** cascade-deleted — they persist as an
audit record with a dangling `event` reference.

---

### `GET /api/events/:id/guests` 🔒 host only

Returns every booking for the event with `user` populated (`name`, `email`, `profilePicture`).
Powers the guest-list tab in `ManageEventScreen`.

```jsonc
// 200
[
  {
    "_id": "68a1…",
    "event": "6890…",
    "user": { "_id": "…", "name": "Virat Kohli", "email": "virat@example.com", "profilePicture": "https://…" },
    "amount": 799, "currency": "INR", "status": "Confirmed",
    "ticketCode": "0F3A-1755851234567",
    "checkedIn": false,
    "createdAt": "2026-08-22T10:01:00.000Z"
  }
]
```

| Status | Body |
| :--- | :--- |
| `200` | Array of bookings |
| `401` | `{ "msg": "Not authorized" }` |
| `404` | `{ "msg": "Event not found" }` |

---

### `POST /api/events/:id/checkin` 🔒 host only

Marks an attendee as arrived. The `ticketCode` is the string decoded from their QR code.

```jsonc
// Request
{ "ticketCode": "0F3A-1755851234567" }

// 200
{ "msg": "Check-in successful", "booking": { …, "checkedIn": true, "user": { "name": "Virat Kohli", … } } }
```

| Status | Body | Cause |
| :--- | :--- | :--- |
| `200` | `{ "msg": "Check-in successful", "booking": … }` | |
| `400` | `{ "msg": "Ticket code is required" }` | Empty body |
| `400` | `{ "msg": "Guest is already checked in" }` | Duplicate scan |
| `401` | `{ "msg": "Not authorized" }` | Caller is not the host |
| `404` | `{ "msg": "Event not found" }` | |
| `404` | `{ "msg": "Invalid ticket for this event" }` | Code unknown, **or** valid for a different event |

**Side effect.** Two notifications are created — `"Checked In Successfully! ✅"` for the attendee and
`"Guest Checked In 👥"` for the host. The response includes the populated `user` so the scanner UI
can display who just arrived without a second request.

---

## 4.6 Bookings

### `POST /api/bookings/checkout` 🔒

Phase 1 of 2. Validates eligibility and creates a payment order. **Creates no booking.**

```jsonc
// Request
{ "eventId": "6890…", "quantity": 1 }

// 200 — free event
{ "amount": 0, "currency": "INR", "orderId": "FREE_EVENT", "key": "<razorpay key id>" }

// 200 — paid event
{ "id": "order_Nq…", "amount": 79900, "currency": "INR", "receipt": "receipt_1755…", "key": "<razorpay key id>" }

// 200 — paid event, gateway unavailable, NODE_ENV ≠ production
{ "id": "order_mock_1755851234567", "amount": 79900, "currency": "INR", "key": "mock_key" }
```

Amounts are in **paise** (₹799 → `79900`), per Razorpay's convention.

| Status | Body | Guard |
| :--- | :--- | :--- |
| `404` | `{ "msg": "Event not found" }` | 1 |
| `400` | `{ "msg": "Registrations for this event have closed" }` | 2 — deadline |
| `400` | `{ "msg": "Host cannot book their own event" }` | 3 |
| `400` | `{ "msg": "Not enough tickets available" }` | 4 — inventory |
| `500` | `Payment Gateway Error` | Razorpay failed **in production** |

---

### `POST /api/bookings/verify` 🔒

Phase 2 of 2. Re-validates, decrements inventory, and commits the booking.

```jsonc
// Request
{
  "razorpay_order_id":   "order_Nq…",
  "razorpay_payment_id": "pay_Nq…",
  "eventId": "6890…",
  "quantity": 1
}

// 200
{
  "msg": "Booking confirmed",
  "booking": {
    "_id": "68a1…", "event": "6890…", "user": "6891…",
    "amount": 799, "currency": "INR", "status": "Confirmed",
    "paymentId": "pay_Nq…", "orderId": "order_Nq…",
    "ticketCode": "0F3A-1755851234567",
    "checkedIn": false,
    "createdAt": "2026-08-22T10:01:00.000Z"
  }
}
```

| Status | Body |
| :--- | :--- |
| `400` | `{ "msg": "Registrations for this event have closed" }` |
| `400` | `{ "msg": "Sold out during processing" }` — inventory was consumed while the user was paying |
| `404` | `{ "msg": "Event not found" }` |

For free events the client sends no Razorpay ids; `paymentId` and `orderId` are stored as the
literal string `'FREE'`.

**Side effect.** A `booking_confirmed` notification is created for the attendee.

> ⚠️ **Signature verification is disabled.** The HMAC-SHA256 check confirming that Razorpay
> authorised the payment is commented out in the handler, so this endpoint currently accepts any
> `razorpay_payment_id`. See [Architecture §1.8](./architecture.md#18-known-limitations--future-work).

---

### `GET /api/bookings/my-bookings` 🔒

The caller's bookings, newest first, with the full `event` document populated.

```jsonc
// 200
[
  {
    "_id": "68a1…",
    "event": { "_id": "6890…", "name": "Neon Beats: Under the Stars", "startDate": "…", "poster": "…", … },
    "user": "6891…",
    "amount": 799, "status": "Confirmed",
    "ticketCode": "0F3A-1755851234567",
    "checkedIn": false,
    "createdAt": "2026-08-22T10:01:00.000Z"
  }
]
```

This is the only `populate` in the codebase without a field projection — it returns the entire
event document per booking.

---

## 4.7 Notifications

### `GET /api/notifications` 🔒

The caller's notifications, newest first.

```jsonc
// 200
[
  {
    "_id": "68b0…",
    "user": "6891…",
    "title": "Booking Confirmed! 🎟️",
    "message": "You have successfully booked tickets for \"Neon Beats\". See you there!",
    "type": "booking_confirmed",
    "relatedId": "68a1…",
    "read": false,
    "createdAt": "2026-08-22T10:01:00.000Z"
  }
]
```

`type` is one of `booking_confirmed`, `check_in`, `event_cancelled`, `general`. `relatedId` is
**polymorphic** — a `Booking` id for `booking_confirmed` and `check_in`, an `Event` id for
`event_cancelled` and city announcements.

### `PUT /api/notifications/read-all` 🔒

```jsonc
// 200
{ "msg": "All notifications marked as read" }
```

Single `updateMany({ user, read: false }, { $set: { read: true } })`.

### `PUT /api/notifications/:id/read` 🔒

| Status | Body |
| :--- | :--- |
| `200` | The updated notification |
| `401` | `{ "msg": "User not authorized" }` — the notification belongs to someone else |
| `404` | `{ "msg": "Notification not found" }` — also for a malformed `ObjectId` |

---

## 4.8 Quick reference — cURL

```bash
BASE=http://localhost:5000

# Register and capture a token
TOKEN=$(curl -s -X POST $BASE/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Demo User","email":"demo@example.com","password":"demo123","city":"Bengaluru"}' \
  | python3 -c 'import sys,json; print(json.load(sys.stdin)["token"])')

# Public reads
curl -s $BASE/health
curl -s "$BASE/api/events?page=1&limit=5"

# Authenticated reads
curl -s $BASE/api/bookings/my-bookings  -H "x-auth-token: $TOKEN"
curl -s $BASE/api/notifications         -H "x-auth-token: $TOKEN"

# Create an event
curl -s -X POST $BASE/api/events \
  -H "x-auth-token: $TOKEN" -H 'Content-Type: application/json' \
  -d '{"name":"Demo Meetup","description":"A demo","category":"Meetup",
       "startDate":"2026-12-01T10:00:00.000Z","endDate":"2026-12-01T13:00:00.000Z",
       "location":{"address":"Bengaluru, Karnataka, India"},
       "ticketType":"Free","price":0,"totalTickets":50}'

# Observability
curl -s $BASE/api/metrics
```

---

← [Backend](./backend.md) · [Docs index](./README.md) · Next: [Mobile App](./mobile-app.md)
