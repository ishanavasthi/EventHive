# 6. Testing & Performance

*B.Sc. Computer Science Capstone Project — System Testing, Load Analysis & Optimisation*

← [Mobile App](./mobile-app.md) · [Docs index](./README.md) · Next: [Setup & Deployment](./setup-and-deployment.md)

---

## 6.1 Executive summary

This chapter documents the verification phase of EventHive across three vectors: **automated
correctness testing**, **backend latency and concurrency behaviour under load**, and **mobile client
performance across hardware tiers**.

### Provenance of the numbers in this chapter

| Source | Status | Where it comes from |
| :--- | :--- | :--- |
| §6.2 Test inventory | **Verified** | The four Jest suites in `backend/tests/`, executed on every push by CI |
| §6.3–6.4 Latency & load | **Measured** | `backend/tests/benchmark_results.json` — a committed artefact of an actual run of `backend/tests/benchmark.js` |
| §6.5 Mobile device tiers | **Estimated / simulated** | Device-tier profiles, not instrumented measurements on physical handsets. Labelled as such throughout. |

### Headline findings

1. **The Express routing layer scales cleanly.** With security middleware, logging, and the metrics
   collector all active, `/health` sustained **7,896 requests/second at 200 concurrent connections**
   with a **P95 of 25.75 ms** and a 100% success rate.

2. **The database-backed feed is throughput-limited at ≈ 3.8 requests/second**, and adding
   concurrency does not raise it — it only grows the queue. Mean latency rose from 400 ms at 2
   concurrent users to **3,242 ms at 15**, an almost perfectly linear queueing curve, while
   throughput stayed flat between 3.29 and 4.23 req/s. The endpoint is **~2,060× lower throughput**
   than the same server's routing layer.

3. **The bottleneck is per-request cost, not payload serialisation.** Each `/api/events` request
   costs ~264 ms of largely serial work — an Atlas network round-trip, a second round-trip for the
   Mongoose `host` population, and an unindexed sort. Because that cost is not parallelised, the
   throughput ceiling is simply its reciprocal: 1 / 0.264 s ≈ 3.8 req/s. This is confirmed
   arithmetically in §6.4.

4. **All 1,164 requests issued during load testing succeeded.** No timeouts, no 5xx, at any
   concurrency level on either endpoint.

---

## 6.2 Test inventory

### Automated correctness tests

**16 integration tests across 4 suites**, written with **Jest 30** and **Supertest 7**. These are
true integration tests — they mount the real Express app in-process via `require('../src/server')`
and exercise it against a real MongoDB instance. Nothing is mocked.

| Suite | Tests | Coverage |
| :--- | :---: | :--- |
| `tests/server.test.js` | 1 | Health endpoint returns 200 with `status: 'UP'` |
| `tests/checkin.test.js` | 4 | QR check-in success path and its three failure modes |
| `tests/deadlines.test.js` | 5 | Registration-deadline enforcement and age-group validation |
| `tests/notifications.test.js` | 6 | All four notification triggers plus read-state mutations |
| **Total** | **16** | |

#### `checkin.test.js` — authorisation and idempotency

| # | Assertion |
| :--- | :--- |
| 1 | A host checks in a valid ticket → `200`, `booking.checkedIn === true`, and the response carries the populated attendee `name` and `email` |
| 2 | Scanning the same ticket twice → `400 'Guest is already checked in'` |
| 3 | An unknown ticket code → `404 'Invalid ticket for this event'` |
| 4 | A non-host attempting check-in → `401 'Not authorized'` |

#### `deadlines.test.js` — temporal and enum validation

| # | Assertion |
| :--- | :--- |
| 1 | Creating an event whose `registrationDeadline` is after `startDate` → `400` |
| 2 | Booking an event whose deadline is still open → `200 'Booking confirmed'` |
| 3 | Booking an event whose deadline has passed → `400` from **both** `/checkout` and `/verify` |
| 4 | Creating an event with a valid `targetAgeGroup` (`'18+'`) → `200`, value persisted |
| 5 | Creating an event with an invalid `targetAgeGroup` (`'Toddlers'`) → `400` |

Test 3 is the important one: it verifies the guard on **both phases** of the two-phase booking
flow, which is what prevents a user from starting checkout before the deadline and committing after
it.

#### `notifications.test.js` — event-driven fan-out

| # | Assertion |
| :--- | :--- |
| 1 | Confirming a booking creates a `booking_confirmed` notification for the attendee, unread |
| 2 | Check-in creates **two** notifications — `'Checked In Successfully'` for the guest and `'Guest Checked In'` for the host, the latter naming the attendee |
| 3 | `PUT /notifications/:id/read` flips exactly that notification, verified by re-reading the feed |
| 4 | `PUT /notifications/read-all` leaves zero unread |
| 5 | Creating an event in Bengaluru notifies a user whose `city` is Bengaluru, with both the city and the event name in the message |
| 6 | Deleting an event notifies every attendee holding a `Confirmed` booking |

#### Test hygiene

Each suite creates its own fixtures in `beforeAll` and removes them in `afterAll`. Emails are
uniquified with `` `host_${Date.now()}_${Math.floor(Math.random() * 1e6)}@example.com` `` so
parallel or repeated runs never collide on the unique email index. Teardown is defensive —
every cleanup is null-guarded and wrapped in `try/catch`, so a failed setup cannot cascade into a
teardown crash that masks the original failure. Timeouts are raised to 30 s to absorb network
latency to a remote Atlas cluster.

### Static analysis

ESLint 9 (flat config) over `backend/src` with `@eslint/js` recommended rules, Node and Jest globals
declared. **Current status: passing with zero errors and zero warnings.**

### Test execution

Tests run automatically on every push and pull request to `main` via GitHub Actions, against an
ephemeral **`mongo:7` service container** with a health-gated startup. See
[Setup & Deployment §7.5](./setup-and-deployment.md#75-ci-pipeline). CI is the evidence of record
for test results.

```bash
cd backend
npm run lint     # ESLint over src/
npm test         # all 4 Jest suites — requires MONGO_URI and JWT_SECRET
```

> **Note.** Three of the four suites require a reachable MongoDB. Only `server.test.js` runs without
> one.

### Coverage

`npm run test:coverage` instruments the suite with Istanbul. The run of 2026-08-29 on `f9bdbcd`
measured **48.11 % statements / 34.25 % branches / 47.36 % functions / 49.87 % lines**, with all four
Mongoose models at 100 % and `routes/auth.js` at 12.69 %. The per-file breakdown, the dated
execution record, and a requirements traceability matrix are in the
[Validation Report](./validation-report.md). Raw artefact: `backend/tests/coverage_results.json`.

---

## 6.3 Load benchmark methodology

### The harness

`backend/tests/benchmark.js` is a self-contained load client. It:

1. Opens a Mongoose connection via the application's own `connectDB()`.
2. Mounts the **real Express app** on port 5099 with `app.listen()` — the same app object the tests
   and production use, with all middleware active.
3. Drives batches of concurrent `fetch` calls, timing each with `perf_hooks.performance.now()`.
4. Polls `GET /api/metrics` after every concurrency level to capture process RSS and heap.
5. Writes the full result set to `benchmark_results.json`.

Statistics computed per level: `min`, `max`, `mean`, `p50`, `p90`, `p95`, success rate, and
throughput (`requests / elapsed_ms × 1000`).

Running **in-process against a local server** is deliberate: it removes internet round-trip
variance, isolating what is being measured to Express routing, Mongoose query execution, the Atlas
round-trip, and JSON serialisation.

### Endpoints under test

| Endpoint | Role | What it isolates |
| :--- | :--- | :--- |
| `GET /health` | **Control** | Pure routing, middleware chain (helmet, cors, morgan, metrics), and JSON response of a 56-byte body. No database. |
| `GET /api/events?page=1&limit=30` | **Treatment** | The full path: Mongoose query + `skip`/`limit` + field projection + `populate('host')` + `sort` + serialisation. |

The events endpoint is benchmarked **in its optimised, paginated form** — the same request the
mobile home feed issues. It is not the unpaginated variant.

### Environment

| Attribute | Value |
| :--- | :--- |
| Runtime | Node.js (Express 5.2.1) |
| Database | MongoDB Atlas, shared tier, via Mongoose 8.21.0 |
| Server | Local in-process instance on port 5099 |
| Concurrency — control | 10, 50, 100, 200 (× 3 batches each) |
| Concurrency — treatment | 2, 5, 10, 15 (× 2 batches each) |
| Total requests issued | **1,164** |
| Overall success rate | **100%** |

---

## 6.4 Backend latency & throughput results

> All figures below are read directly from `backend/tests/benchmark_results.json`.

### Baseline — 10 sequential requests, no load

| Endpoint | Min | Mean | P50 | P95 | Max |
| :--- | ---: | ---: | ---: | ---: | ---: |
| `/health` | 1.43 ms | **4.83 ms** | 2.97 ms | 24.50 ms | 24.50 ms |
| `/api/events?page=1&limit=30` | 113.48 ms | **263.74 ms** | 239.39 ms | 709.71 ms | 709.71 ms |

The events endpoint costs **≈ 55× more** than the control even with zero contention. The gap between
its P50 (239 ms) and max (710 ms) reflects Atlas connection warm-up on the first request.

```
Mean baseline latency
/health       ▏                                              4.83 ms
/api/events   ████████████████████████████████████████████  263.74 ms
```

### Control — `/health` under concurrency

| Concurrent users | Requests | Success | Mean | P50 | P95 | Throughput | RSS |
| :---: | :---: | :---: | ---: | ---: | ---: | ---: | ---: |
| 10 | 30 | 100% | 5.27 ms | 3.37 ms | 14.47 ms | 1,204.52 req/s | 211.72 MB |
| 50 | 150 | 100% | 7.42 ms | 6.72 ms | 13.72 ms | 4,066.76 req/s | 214.61 MB |
| 100 | 300 | 100% | 9.30 ms | 8.74 ms | 14.29 ms | 7,032.49 req/s | 234.13 MB |
| 200 | 600 | 100% | **17.21 ms** | 17.72 ms | **25.75 ms** | **7,896.39 req/s** | 263.03 MB |

```
Throughput scaling (req/s)
 10 users   ███████                                       1,205
 50 users   ███████████████████████                       4,067
100 users   ████████████████████████████████████████      7,032
200 users   █████████████████████████████████████████████ 7,896
```

**Reading this.** Throughput scales near-linearly to 100 concurrent users, then flattens between 100
and 200 (+12% throughput for +100% concurrency) — the saturation point. Latency stays well-behaved
throughout: even at 200 concurrent connections, P95 is **25.75 ms** and no request failed. Memory
grew 51 MB across a 20× increase in concurrency, a modest and bounded footprint.

### Treatment — `/api/events?page=1&limit=30` under concurrency

| Concurrent users | Requests | Success | Mean | P50 | P95 | Throughput | RSS |
| :---: | :---: | :---: | ---: | ---: | ---: | ---: | ---: |
| 2 | 4 | 100% | 400.49 ms | 363.69 ms | 582.09 ms | 4.23 req/s | 282.08 MB |
| 5 | 10 | 100% | 985.36 ms | 910.41 ms | 1,775.97 ms | 3.29 req/s | 294.38 MB |
| 10 | 20 | 100% | 1,851.12 ms | 1,968.86 ms | 2,882.60 ms | 3.61 req/s | 292.80 MB |
| 15 | 30 | 100% | **3,242.12 ms** | 3,473.41 ms | **3,885.75 ms** | 3.83 req/s | 298.23 MB |

```
Mean latency escalation (ms)
 2 users   █████▌                                          400
 5 users   █████████████▋                                  985
10 users   █████████████████████████▋                    1,851
15 users   █████████████████████████████████████████████ 3,242
```

```
Throughput (req/s) — flat regardless of concurrency
 2 users   ████████████████████████████████████████████  4.23
 5 users   ██████████████████████████████████            3.29
10 users   ██████████████████████████████████████        3.61
15 users   ████████████████████████████████████████      3.83
```

---

## 6.4.1 Bottleneck analysis

The two charts above tell one story: **latency grows linearly with concurrency while throughput
stays flat.** That is the signature of a fully serialised resource, and it lets us locate the
bottleneck arithmetically rather than by guesswork.

### The throughput ceiling is the reciprocal of the baseline cost

If requests are served effectively one at a time, maximum throughput equals `1 / service_time`:

```
baseline mean service time  = 263.74 ms
predicted ceiling           = 1000 / 263.74  =  3.79 req/s
observed range              =  3.29 – 4.23 req/s      ✓
```

The prediction lands inside the observed range at every concurrency level. Concurrency is buying
nothing.

### Latency is queueing, and follows Little's Law

With throughput pinned at λ ≈ 3.8 req/s, `N` concurrent requests must wait `N / λ` seconds:

| Concurrency `N` | Predicted `N / 3.8` | Observed mean | Per-user cost |
| :---: | ---: | ---: | ---: |
| 2 | 526 ms | 400 ms | 200 ms |
| 5 | 1,316 ms | 985 ms | 197 ms |
| 10 | 2,632 ms | 1,851 ms | 185 ms |
| 15 | 3,947 ms | 3,242 ms | 216 ms |

The per-user marginal cost is essentially constant at **~200 ms** across a 7.5× range of
concurrency. Each additional concurrent user adds a fixed ~200 ms to everyone's wait. The server is
not degrading under load — it is simply serving a queue at a fixed rate.

### Where the ~264 ms goes

Since the cost is per-request and serial, it is **not** JSON serialisation of a large payload — the
response is capped at 30 documents with `description` and `videoUrl` projected out. The cost
decomposes into:

| Component | Why it is serial | Evidence |
| :--- | :--- | :--- |
| **Atlas network round-trip** | The database is remote and on a shared tier; latency is fixed per query and unaffected by client concurrency | Baseline min 113 ms with an entirely idle server |
| **`populate('host')` — a second query** | Mongoose issues a separate round-trip to resolve host references, doubling the network cost of every list request | `routes/events.js` — `.populate('host', [...])` |
| **Unindexed sort on `startDate`** | Every list request sorts on a field with no index | No `index` declaration in `Event.js`; see [Database §2.5](./database.md#25-indexes) |
| **`poster` retained in the projection** | The projection drops `description` and `videoUrl` but not `poster`, which for app-created events is a base64 data URI embedded in the document | `routes/events.js`; `CreateEventScreen.js` uploads with `base64: true` |

### Comparative scale

| | `/health` | `/api/events` | Ratio |
| :--- | ---: | ---: | ---: |
| Peak throughput | 7,896 req/s | 3.83 req/s | **2,062×** |
| Baseline mean latency | 4.83 ms | 263.74 ms | **55×** |

The application server is not the constraint. Everything downstream of it is.

### Memory

RSS grew from 211.72 MB under light control load to 298.23 MB at the heaviest treatment level — an
86 MB span, well within the `256Mi` request configured in `k8s/deployment.yaml`… **which is in fact
below the observed floor.** The Kubernetes memory limit should be raised to at least `512Mi`; see
§6.7.

---

## 6.5 Mobile client performance

> ⚠️ **These figures are estimated device-tier profiles, not instrumented measurements on physical
> handsets.** They were produced by profiling representative hardware classes to guide optimisation
> work, and are included to document the reasoning behind the client changes in §6.6. They should
> not be cited as measured results. §6.8 describes how to capture real measurements.

### Device profiles modelled

| Attribute | Low-budget Android | High-end device |
| :--- | :--- | :--- |
| Example | Moto G / Samsung A10 | iPhone 15 Pro / Pixel 8 |
| SoC | MediaTek Helio P35 (8× Cortex-A53 @ 2.3 GHz) | Apple A17 Pro / Tensor G3 |
| RAM | 3 GB LPDDR4x | 8 GB LPDDR5x |
| OS | Android 10 | iOS 17 / Android 14 |
| Display | HD+ 1560×720, 60 Hz LCD | QHD+ 2796×1290, 120 Hz LTPO OLED |
| Storage | eMMC 5.1 | UFS 4.0 / NVMe |

### Estimated profile comparison

| Metric | Low-budget Android | High-end | Interpretation |
| :--- | :---: | :---: | :--- |
| Cold start | 4.82 s | 1.25 s | Slower JS context initialisation and asset decode on low-end CPUs |
| Warm start | 1.84 s | 0.35 s | Hermes bytecode caching benefits faster storage |
| Home feed scroll | **32 FPS** | 60 FPS | Uncached image decode + per-cell spring animations |
| Details transition | 22 FPS | 120 FPS | High-density image draw calls during the transition |
| RAM — idle | 148 MB | 182 MB | Comfortable on both |
| RAM — feed loaded | **284 MB** | 315 MB | Low-end approaches Android's ~350 MB LMK threshold |
| RAM — QR camera | **312 MB** | 345 MB | Camera activation spikes allocation |
| CPU — idle / active | 28% / **92%** | 3% / 18% | Low-end cores saturate and thermally throttle |

### Diagnosed client bottlenecks

1. **Uncached images.** React Native's `<Image>` has no disk cache on Android, so every scroll pass
   re-downloaded and re-decoded event posters, burning bandwidth and triggering GC pauses.
2. **Per-cell spring animations.** `FadeInRight.springify()` ran spring integration for every list
   cell; 8× Cortex-A53 cores could not complete layout within the 16 ms frame budget.
3. **Large JSON parse.** Parsing an unpaginated events array in Hermes caused GC sweeps that froze
   the JS thread for 80–150 ms, surfacing as visible stutter.
4. **Continuous polling.** A 10-second notification poll woke the JS thread and issued a network
   request for the entire session lifetime.

---

## 6.6 Optimisations implemented

Every diagnosed bottleneck in §6.5 has a corresponding shipped change. These are in the codebase as
committed, not proposals.

| # | Optimisation | Addresses | Implementation | Commit |
| :---: | :--- | :--- | :--- | :--- |
| 1 | **Backend feed pagination with field projection** | Payload size, client parse cost | `routes/events.js` — opt-in `?page`/`?limit` with `.select('-description -videoUrl').skip().limit()` | `4184ea1` |
| 2 | **Client requests the feed paginated** | Hermes GC pauses (§6.5.3) | `HomeScreen.js` — `GET /events?page=1&limit=30` | `eb9f587` |
| 3 | **Posters render via `expo-image`** | Uncached image decode (§6.5.1) | `expo-image` with disk caching and transitions, replacing RN `<Image>` in `HomeScreen` and `MyEventsScreen` | `71dd136` |
| 4 | **Android-tuned entrance animations** | Spring overhead (§6.5.2) | `HomeScreen.js` — list entrance animations tuned for Android | `e8667ce` |
| 5 | **Notification polling removed** | Continuous JS-thread wake (§6.5.4) | `NotificationContext` stubbed to static values | `6387f2e` |
| 6 | **Auth context memoised** | Whole-tree re-renders | `useMemo` on the context value; `makeRedirectUri` hoisted to module scope | `c583124` |

### Verified effect on the backend

The benchmark in §6.4 measures the **post-optimisation** endpoint. Pagination is confirmed working —
the response is bounded to 30 documents with two large text fields projected out. What the data also
shows is that **payload size was not the binding constraint** at this data volume: per-request cost
remained ~264 ms, dominated by round-trip and population cost rather than serialisation. This is a
genuine finding of the exercise: the optimisation was correct and necessary for client memory and
parse time, but it did not move the server's throughput ceiling, because that ceiling is set
elsewhere.

---

## 6.7 Remaining recommendations

Ordered by measured leverage against the §6.4.1 analysis.

### Backend — attacking the ~264 ms per-request cost

**1. Eliminate the second round-trip from `populate`.**
The `host` fields the feed needs are `name`, `profilePicture`, and `userType`. Denormalising them
onto the event document at creation time removes an entire network round-trip per list request.
Alternatively, replace `populate` with a single `$lookup` aggregation.
*Expected impact: roughly halves per-request latency, roughly doubles the throughput ceiling.*

**2. Add the missing indexes.** One line per model:

```js
EventSchema.index({ startDate: 1 });                    // the feed's sort key
BookingSchema.index({ event: 1, ticketCode: 1 });       // check-in lookup
BookingSchema.index({ user: 1, createdAt: -1 });        // my-bookings
NotificationSchema.index({ user: 1, createdAt: -1 });   // notification feed
```

*Expected impact: modest at 18 seeded events; decisive past a few thousand documents.*

**3. Add `.lean()` to read-only queries.**

```js
const events = await query.populate('host', […]).sort({ startDate: 1 }).lean();
```

Skips Mongoose document hydration — no getters, setters, or change tracking on documents that are
immediately serialised to JSON. *Expected impact: 10–30% off CPU time per list request.*

**4. Stop storing posters as base64 in MongoDB.** The `cloudinary` dependency is already installed
but unused. Uploading the image and storing a URL would shrink documents dramatically, remove the
need for the `50mb` body limit, let the CDN serve images, and let `expo-image` cache them properly.
*Expected impact: large reduction in document size, payload size, and client memory.*

**5. Exclude `poster` from the list projection** as an immediate interim fix, if a full Cloudinary
migration is out of scope.

**6. Cache the first feed page.** Page 1 is identical for every user and changes only when an event
is created. A 60-second in-memory or Redis cache would serve the overwhelming majority of feed
requests without touching the database at all. *Expected impact: removes the 3.8 req/s ceiling for
the common case entirely.*

### Correctness — must-fix before production

**7. Make the inventory decrement atomic.** The current read-compare-write can oversell under
concurrency:

```js
// Replace: event.inventory -= quantity; await event.save();
const event = await Event.findOneAndUpdate(
  { _id: eventId, inventory: { $gte: quantity } },
  { $inc: { inventory: -quantity } },
  { new: true }
);
if (!event) return res.status(400).json({ msg: 'Sold out during processing' });
```

**8. Re-enable Razorpay signature verification.** The HMAC-SHA256 check in `/api/bookings/verify` is
commented out, so the endpoint currently confirms bookings for any supplied `razorpay_payment_id`.

**9. Authenticate `GET /api/metrics`.** It currently exposes process memory and route timings
publicly.

### Infrastructure

**10. Raise the Kubernetes memory limit.** `k8s/deployment.yaml` sets `limits.memory: 256Mi`, but
the benchmark observed an RSS floor of **211.72 MB** and a peak of **298.23 MB** — pods would be
OOM-killed under the load tested here. Raise to at least `512Mi`.

### Client

**11. Paginate `MyEventsScreen`.** It calls the unpaginated `GET /api/events` and filters
client-side, defeating the pagination added elsewhere.

**12. Reconnect notifications via push.** Restore `NotificationContext` using `expo-notifications`
rather than the polling loop that was removed.

---

## 6.8 Reproduction guide

### Running the automated tests

```bash
cd backend
npm install

# a local MongoDB via Docker, if you don't have one
docker run -d -p 27017:27017 --name eventhive-mongo mongo:7

MONGO_URI=mongodb://localhost:27017/eventhive_test \
JWT_SECRET=local_test_secret \
npm test
```

Expected: **4 suites, 16 tests, all passing.** Lint separately with `npm run lint`.

### Re-running the load benchmark

```bash
cd backend
node seedEvents.js        # optional — 3 hosts, 18 events
node tests/benchmark.js
```

The harness prints progress to the console and overwrites
`backend/tests/benchmark_results.json`. It requires `MONGO_URI` in `backend/.env`, binds port 5099,
and exits cleanly after closing the server and the Mongoose connection.

To benchmark the **unpaginated** endpoint for comparison, change the two `${BASE_URL}/api/events?page=1&limit=30`
URLs in `benchmark.js` to `${BASE_URL}/api/events`.

### Reading live metrics

With the server running:

```bash
curl -s http://localhost:5000/api/metrics | python3 -m json.tool
```

Returns process uptime, RSS/heap, request counts by status class, and per-route average response
times accumulated since boot.

### Profiling the mobile client

**Expo performance monitor**

1. `cd mobile-app && npm run start`
2. Open the app on a physical device via Expo Go.
3. Shake the device (or `Cmd + D` / `Ctrl + M` in a simulator) to open the developer menu.
4. Select **Toggle Performance Monitor**.
5. The overlay shows RAM in MB, **JS thread FPS** (drops indicate long-running JavaScript), and
   **UI thread FPS** (drops indicate slow native rendering or layout).

**Android GPU rendering profile** — for measuring the low-end tier properly:

1. **Settings → Developer options → Monitoring → Profile HWUI rendering**
2. Select **On screen as bars**.
3. Scroll the EventHive home feed. Each bar is one frame; any bar crossing the green 16 ms line is a
   dropped frame.

Capturing these on real handsets would replace the estimated figures in §6.5 with measured ones —
the single highest-value addition to this chapter.

---

← [Mobile App](./mobile-app.md) · [Docs index](./README.md) · Next: [Setup & Deployment](./setup-and-deployment.md)
