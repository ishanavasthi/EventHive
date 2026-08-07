# 3. Backend

← [Database](./database.md) · [Docs index](./README.md) · Next: [API Reference](./api-reference.md)

---

## 3.1 Application bootstrap

`backend/src/server.js` is the entire application wiring — roughly 110 lines that assemble
middleware, mount four routers, and expose two system endpoints.

```js
const app = express();

app.use(metricsMiddleware);                    // 1. timing + counters (first, to measure everything)
app.use(express.json({ limit: '50mb' }));      // 2. body parsing — 50 MB for base64 posters
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());                               // 3. permissive CORS (mobile client, no cookies)
app.use(helmet());                             // 4. security headers
app.use(morgan('dev'));                        // 5. request logging

app.get('/health',      …);                    // liveness probe
app.get('/api/metrics', …);                    // in-process observability

app.use('/api/auth',          require('./routes/auth'));
app.use('/api/events',        require('./routes/events'));
app.use('/api/bookings',      require('./routes/bookings'));
app.use('/api/notifications', require('./routes/notifications'));

if (require.main === module) { connectDB(); app.listen(PORT, '0.0.0.0'); }
module.exports = app;
```

**Ordering matters here.** `metricsMiddleware` is first so its `res.on('finish')` hook captures the
complete handler duration including body parsing. The `50mb` body limit exists specifically because
`CreateEventScreen` uploads event posters as base64 data URIs (see
[Architecture §1.8](./architecture.md#18-known-limitations--future-work), item 4).

The `require.main === module` guard is what makes the app testable — see
[Architecture §1.3](./architecture.md#the-testability-seam).

---

## 3.2 Authentication

### The middleware

`backend/src/middleware/auth.js` is 20 lines and does exactly one thing:

```js
const token = req.header('x-auth-token');
if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });
try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = decoded.user;          // { id }
  next();
} catch (err) {
  res.status(401).json({ msg: 'Token is not valid' });
}
```

It is applied **per route**, never globally, so public endpoints skip it entirely. Note that it
attaches only `{ id }` — no role, no email. Any handler needing more must re-read the user document.

### Registration and login

`POST /api/auth/register` and `POST /api/auth/login`, in `routes/auth.js`:

1. `express-validator` checks run first — name non-empty, valid email, password ≥ 6 characters.
   Failures return `400 { errors: [...] }` before any database work.
2. Register rejects duplicate emails with `400 { msg: 'User already exists' }`.
3. Password is hashed with **bcrypt, 10 salt rounds** (`genSalt(10)` then `hash`).
4. Login compares with `bcrypt.compare`. Both a missing user and a wrong password return the same
   `400 { errors: [{ msg: 'Invalid Credentials' }] }` — no user enumeration.
5. On success a JWT is signed with `{ user: { id } }`, `expiresIn: '5 days'`, and returned alongside
   the user document **with `password` deleted**.

### Federated sign-in

**Google** (`POST /api/auth/google`) — the client obtains an `id_token` via `expo-auth-session`. The
server verifies it with `OAuth2Client.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID })`,
extracts `{ name, email, picture }`, finds or creates the user, and issues an EventHive JWT.

**Apple** (`POST /api/auth/apple`) — the client obtains an `identityToken` via
`expo-apple-authentication`. The server verifies it against Apple's public JWKS:

```js
const appleClient = jwksClient({ jwksUri: 'https://appleid.apple.com/auth/keys' });

jwt.verify(identityToken, getAppleSigningKey, {
  algorithms: ['RS256'],
  audience: process.env.APPLE_BUNDLE_ID || 'com.eventhive.mobile',
  issuer:   'https://appleid.apple.com'
}, async (err, decoded) => { … });
```

The `getAppleSigningKey` callback looks up the signing key by the token's `kid` header, so key
rotation on Apple's side is handled automatically.

Apple returns the user's real name **only on first authorisation**, so the handler falls back to
the email local-part when `fullName` is absent — matching Apple's documented behaviour rather than
storing `'Apple User'` forever.

Both paths auto-provision missing users with `password: await bcrypt.hash(Math.random().toString(36), 10)`.

### Authorisation

There is no role system in effect. Every privileged operation re-reads the resource and compares
ownership:

```js
if (event.host.toString() !== req.user.id) {
  return res.status(401).json({ msg: 'User not authorized' });
}
```

This appears in `DELETE /api/events/:id`, `GET /api/events/:id/guests`,
`POST /api/events/:id/checkin`, and `PUT /api/notifications/:id/read`. The `.toString()` is
required because `event.host` is an `ObjectId` and `req.user.id` is a string.

---

## 3.3 Event management

`backend/src/routes/events.js`

### Creation — `POST /api/events`

Validation runs in two layers:

**Layer 1 — `express-validator`**, declarative, in the route definition:
- `name`, `description`, `startDate`, `endDate`, `location.address` non-empty
- `targetAgeGroup`, if present, must be in the enum
- `totalTickets` uses a **custom validator** that is conditional on the request body:

```js
check('totalTickets', 'Ticket count is required').custom((value, { req }) => {
  if (!req.body.isExternalTicket) {
    if (value === undefined || value === null || value === '') throw new Error('Ticket count is required');
    if (isNaN(value)) throw new Error('Ticket count must be numeric');
  }
  return true;
})
```

Externally-ticketed events genuinely have no capacity to declare, so the requirement is waived
rather than forcing a meaningless `0`.

**Layer 2 — business rules**, imperative, in the handler:

```js
if (registrationDeadline && new Date(registrationDeadline) > new Date(startDate)) {
  return res.status(400).json({ errors: [{ msg: 'Registration deadline must be before or equal to the event start date' }] });
}
```

### Field normalisation

The handler normalises three interdependent fields so the stored document is always internally
consistent, regardless of what the client sent:

```js
price:         isExternalTicket ? 0      : (ticketType === 'Free' ? 0 : price),
ticketType:    isExternalTicket ? 'Free' : ticketType,
totalTickets:  isExternalTicket ? 0      : totalTickets,
inventory:     isExternalTicket ? 0      : totalTickets,   // inventory starts at capacity
```

`inventory` being seeded from `totalTickets` at creation is what makes the "remaining tickets"
counter work without a `count()` query on every read.

### Listing — `GET /api/events`

```js
let query = Event.find();

if (page && limit) {
  query = query.select('-description -videoUrl').skip((page - 1) * limit).limit(limit);
}

const events = await query
  .populate('host', ['name', 'email', 'profilePicture', 'userType'])
  .sort({ startDate: 1 });
```

Pagination is **opt-in**: without `?page` and `?limit` the endpoint returns every event with all
fields, preserving backwards compatibility for `MyEventsScreen`, which still calls it unpaginated.
The mobile home feed requests `?page=1&limit=30`.

The projection drops `description` and `videoUrl` — the two largest text fields not needed for a
feed card. It notably does **not** drop `poster`, which is where the remaining payload weight sits.

### Deletion — `DELETE /api/events/:id`

Deletion is ownership-guarded and **notifies before destroying**: it queries all `Confirmed`
bookings for the event, bulk-inserts an `event_cancelled` notification per attendee via
`Notification.insertMany`, and only then calls `event.deleteOne()`.

Note that bookings are **not** cascade-deleted — they remain as an audit trail, though their
`event` reference becomes dangling.

### `ObjectId` error handling

Every `:id` route distinguishes a malformed id from a missing document:

```js
catch (err) {
  if (err.kind === 'ObjectId') return res.status(404).json({ msg: 'Event not found' });
  res.status(500).send('Server Error');
}
```

Without this, passing a non-ObjectId string would surface as a 500 instead of a 404.

---

## 3.4 Booking and payment

`backend/src/routes/bookings.js`

The booking flow is deliberately **two-phase**: `checkout` creates a payment intent, `verify`
commits the booking. This mirrors how payment gateways work — the client leaves the app to pay, and
the server must not create a booking until it returns.

```mermaid
sequenceDiagram
    autonumber
    participant C as Client
    participant S as Server
    participant R as Razorpay
    participant D as MongoDB

    C->>S: POST /bookings/checkout { eventId, quantity }
    S->>D: Event.findById
    Note over S: guard 1 — event exists?<br/>guard 2 — registration deadline passed?<br/>guard 3 — is the requester the host?<br/>guard 4 — enough inventory?

    alt Free event (price 0)
        S-->>C: { amount: 0, orderId: 'FREE_EVENT' }
    else Paid event
        S->>R: orders.create({ amount: price*qty*100, currency: INR })
        alt Razorpay succeeds
            R-->>S: order
            S-->>C: { ...order, key }
        else Razorpay fails and NODE_ENV ≠ production
            S-->>C: { id: 'order_mock_…' }  (mock order)
        else Razorpay fails in production
            S-->>C: 500 Payment Gateway Error
        end
    end

    C->>S: POST /bookings/verify { razorpay_order_id, razorpay_payment_id, eventId, quantity }
    Note over S: re-check deadline and inventory<br/>(state may have changed since checkout)
    S->>D: event.inventory -= quantity; save()
    S->>D: Booking.create({ status: 'Confirmed', ticketCode })
    S->>D: Notification.create({ type: 'booking_confirmed' })
    S-->>C: { msg: 'Booking confirmed', booking }
```

### The four checkout guards

Order matters — each is cheaper than the next and short-circuits:

| # | Guard | Response |
| :--- | :--- | :--- |
| 1 | Event exists | `404 { msg: 'Event not found' }` |
| 2 | `registrationDeadline` not passed | `400 { msg: 'Registrations for this event have closed' }` |
| 3 | Requester is not the host | `400 { msg: 'Host cannot book their own event' }` |
| 4 | `inventory >= quantity` | `400 { msg: 'Not enough tickets available' }` |

### Re-validation in `verify`

`verify` repeats the deadline and inventory checks rather than trusting `checkout`. This is correct:
an arbitrary amount of wall-clock time passes while the user is in the payment sheet, during which
the deadline can lapse or the event can sell out. The inventory failure at this stage returns a
distinct message — `'Sold out during processing'` — so the client can explain what happened.

### Amount is captured, not referenced

`Booking.amount` stores `event.price * quantity` at write time. A later price change by the host
does not rewrite what an attendee paid.

### Development fallbacks

Two deliberate escape hatches keep the demo runnable without live payment credentials:

- The Razorpay client initialises with placeholder keys
  (`process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder'`) so the server **boots** without them.
- If `orders.create` throws and `NODE_ENV !== 'production'`, the handler returns a synthetic
  `order_mock_<timestamp>` instead of a 500.

> ⚠️ **The signature verification is commented out.** The HMAC-SHA256 check that would confirm
> Razorpay actually authorised the payment is present in the source but disabled. As committed,
> `/verify` will confirm a booking for any `razorpay_payment_id` the client supplies. This is the
> one change required before the system could handle real money.

---

## 3.5 Notification fan-out

Notifications are created **server-side as a side effect of domain events** — there is no separate
notification service or queue. Four triggers exist:

| Trigger | Recipients | Type | Written by |
| :--- | :--- | :--- | :--- |
| Booking confirmed | The attendee | `booking_confirmed` | `POST /api/bookings/verify` |
| Guest checked in | The attendee **and** the host (2 documents) | `check_in` | `POST /api/events/:id/checkin` |
| Event deleted | Every attendee with a `Confirmed` booking | `event_cancelled` | `DELETE /api/events/:id` |
| Event created in your city | Every user whose `city` matches, excluding the host | `general` | `POST /api/events` |

### City matching

The city fan-out is the only non-obvious one. On event creation:

```js
const CITIES = ['New Delhi', 'Mumbai', 'Bengaluru', 'Pune', 'Hyderabad'];
const addressLower = location.address ? location.address.toLowerCase() : '';
const matchedCity  = CITIES.find(c => addressLower.includes(c.toLowerCase()));

if (matchedCity) {
  const usersInCity = await User.find({
    city: { $regex: new RegExp(matchedCity, 'i') },
    _id:  { $ne: req.user.id }                       // never notify yourself
  });
  await Notification.insertMany(usersInCity.map(u => new Notification({ … })));
}
```

The Google Places autocomplete returns a full formatted address
(`"Whitefield, Bengaluru, Karnataka, India"`), so a substring match against a fixed city list is a
reliable enough extraction without a geocoding round-trip. It is bounded to five cities by design —
the seeded demo data and the client's city filter use the same list.

### Failure isolation

The entire fan-out block is wrapped in its own `try/catch`:

```js
} catch (notifErr) {
  console.error('Failed to trigger city notifications:', notifErr.message);
}
```

A notification failure must never fail the event creation that triggered it. The event is already
persisted at this point, and the client gets its `200` regardless.

### Bulk writes

Multi-recipient fan-outs (city announcements, cancellations) use `Notification.insertMany` — one
round-trip rather than N. The two-recipient check-in case uses two individual `save()` calls, which
is fine at that cardinality.

---

## 3.6 Check-in

`POST /api/events/:id/checkin` is the door-scanning endpoint. The client passes the string decoded
from the attendee's QR code as `ticketCode`.

```js
if (!ticketCode)                          → 400 'Ticket code is required'
event = await Event.findById(req.params.id)
if (!event)                               → 404 'Event not found'
if (event.host.toString() !== req.user.id) → 401 'Not authorized'

booking = await Booking.findOne({ event: req.params.id, ticketCode })
if (!booking)                             → 404 'Invalid ticket for this event'
if (booking.checkedIn)                    → 400 'Guest is already checked in'

booking.checkedIn = true; await booking.save()
await booking.populate('user', ['name', 'email', 'profilePicture'])
// → 2 notifications, then 200 { msg: 'Check-in successful', booking }
```

Two details worth noting:

- **The lookup is scoped to the event.** `findOne({ event, ticketCode })` means a valid ticket for
  *a different* event returns `'Invalid ticket for this event'` rather than checking someone in at
  the wrong door.
- **`populate` runs after `save`.** The response carries the attendee's name and photo so the
  scanning UI can show *who* just walked in without a second request.

All six of these branches are covered by integration tests — see
[Testing §6.2](./testing-and-performance.md#62-test-inventory).

---

## 3.7 Observability

Two system endpoints, both unauthenticated.

### `GET /health`

Returns `200 { status: 'UP', message: 'EventHive Backend is running' }`. It touches no database, so
it measures pure routing and middleware overhead — which is exactly why the load benchmark uses it
as the control. It also serves as the Kubernetes liveness target and the ping target for
`keep_alive.js`, which hits it every 10 minutes to stop Render's free tier from sleeping.

### `GET /api/metrics`

The `metricsMiddleware` accumulates, in process memory:

- total request count
- counts bucketed by status class (`1xx`–`5xx`)
- per-route request count and cumulative time, keyed by `${method} ${baseUrl}${route.path}` so that
  `/api/events/507f…` and `/api/events/aaaa…` aggregate under one `GET /api/events/:id` key

The endpoint computes average response time per route and adds live process telemetry —
`uptimeSeconds`, a formatted uptime string, and `rss` / `heapTotal` / `heapUsed` / `external` in MB.

```jsonc
{
  "system":   { "uptimeSeconds": 412, "uptimeFormatted": "0d 0h 6m 52s",
                "memoryUsage": { "rssMB": 263.03, "heapUsedMB": 47.34, … } },
  "requests": { "total": 1084, "byStatus": { "2xx": 1080, "4xx": 4, … } },
  "routes":   { "GET /api/events": { "requestCount": 64, "averageResponseTimeMs": 263.74, … } }
}
```

The benchmark harness polls this endpoint after each concurrency level, which is how the memory
column in the load results is produced.

**Limitations:** counters are in-process, so they reset on restart and do not aggregate across the
two Kubernetes replicas. The endpoint requires no authentication.

---

## 3.8 Error-handling conventions

There is no central error middleware. Each handler wraps its body in `try/catch` and follows a
consistent shape:

| Situation | Status | Body |
| :--- | :--- | :--- |
| Validation failure (`express-validator`) | `400` | `{ errors: [{ msg, param, … }] }` |
| Business-rule rejection | `400` | `{ msg: '…' }` |
| Missing / invalid token | `401` | `{ msg: 'No token, authorization denied' \| 'Token is not valid' }` |
| Ownership violation | `401` | `{ msg: 'Not authorized' }` |
| Resource missing, or malformed `ObjectId` | `404` | `{ msg: '… not found' }` |
| Unexpected error | `500` | `'Server Error'` *(plain text)* |

Note the inconsistency worth flagging: validation errors return an `errors` **array**, business
rules return a single `msg` **string**, and 500s return plain text rather than JSON. The client
handles all three (`err.response?.data?.msg || 'fallback'`), but a single error envelope would be
cleaner.

---

← [Database](./database.md) · [Docs index](./README.md) · Next: [API Reference](./api-reference.md)
