# 9. Validation Report

*Capstone Project — Verification & Validation Record · Team Developer Mindset · BITS Pilani Digital*

← [User Manual](./user-manual.md) · [Docs index](./README.md) · Next: [Originality & Compliance](./originality-and-compliance.md)

---

## 9.1 Scope and verdict

This chapter is the **dated, reproducible record** that EventHive was verified before submission. It
consolidates four validation activities:

| # | Activity | Result | §|
| :---: | :--- | :--- | :---: |
| 1 | Automated test execution — 16 integration tests, 4 suites | ✅ **16 / 16 passed, 0 failed** | 9.2 |
| 2 | Code-coverage measurement | ⚠️ **48.11 % statements, 34.25 % branch** — below a typical 60 % target | 9.3 |
| 3 | Static analysis (ESLint 9) | ✅ **0 errors, 0 warnings** | 9.4 |
| 4 | Performance / load validation | ✅ **100 % success across 1,164 requests**; throughput ceiling identified | 9.5 |

**Overall verdict: the system is functionally correct on every path exercised by the suite, and its
performance characteristics are measured and explained rather than assumed.** The two qualified
results are stated plainly in §9.3 and §9.6 rather than smoothed over: coverage is uneven, and eight
known defects (documented in [Architecture §1.8](./architecture.md#18-known-limitations--future-work))
remain open by design, with fixes identified.

---

## 9.2 Test execution record

### Run metadata

| Field | Value |
| :--- | :--- |
| Date of run | **2026-08-29, 08:42 UTC** |
| Commit under test | `f9bdbcd` (`main`) |
| Command | `npm run test:coverage` (`jest --coverage --runInBand`) |
| Runner | Jest 30.2.0 · Supertest 7.2.2 |
| Node.js | v26.7.0 |
| npm | 11.19.0 |
| Platform | macOS 26.5.2, Apple silicon (arm64) |
| Database | Ephemeral in-memory `mongod` 7.x, fresh per run |
| Env | `MONGO_URI` → ephemeral instance · `JWT_SECRET` → run-scoped test secret |
| Wall-clock | 0.99 s (0.81 s on the verification re-run) |

> These are true integration tests. Each suite mounts the real Express application in-process via
> `require('../src/server')` and exercises it against a real MongoDB. **Nothing is mocked** — no
> stubbed database, no faked router, no intercepted HTTP.

### Result summary

```
Test Suites: 4 passed, 4 total
Tests:       16 passed, 16 total
Snapshots:   0 total
Time:        0.99 s
```

### Per-test results

| # | Suite | Test | Result |
| :---: | :--- | :--- | :---: |
| 1 | `server.test.js` | `GET /health` should return 200 and status UP | ✅ 1 ms |
| 2 | `checkin.test.js` | should successfully check in a guest and populate user info | ✅ 7 ms |
| 3 | `checkin.test.js` | should return 400 if user is already checked in | ✅ 1 ms |
| 4 | `checkin.test.js` | should return 404 for invalid ticket code | ✅ 2 ms |
| 5 | `checkin.test.js` | should return 401 if non-host tries to check in guests | ✅ 1 ms |
| 6 | `deadlines.test.js` | should reject event creation if the registration deadline is set after the event starts | ✅ 3 ms |
| 7 | `deadlines.test.js` | should successfully book tickets for events with open registration deadlines | ✅ 8 ms |
| 8 | `deadlines.test.js` | should reject bookings if the registration deadline has already passed | ✅ 3 ms |
| 9 | `deadlines.test.js` | should successfully create an event with a valid `targetAgeGroup` | ✅ 3 ms |
| 10 | `deadlines.test.js` | should reject event creation if `targetAgeGroup` is invalid | ✅ 1 ms |
| 11 | `notifications.test.js` | should trigger notification for attendee when booking is confirmed | ✅ 21 ms |
| 12 | `notifications.test.js` | should trigger notifications for both guest and host on check-in | ✅ 11 ms |
| 13 | `notifications.test.js` | should mark a specific notification as read | ✅ 4 ms |
| 14 | `notifications.test.js` | should mark all notifications as read | ✅ 3 ms |
| 15 | `notifications.test.js` | should trigger notification for users in the same city when a new event is posted | ✅ 8 ms |
| 16 | `notifications.test.js` | should notify attendees when an event is cancelled | ✅ 6 ms |

**0 failures · 0 skipped · 0 flaky.** The per-case assertions behind each test are enumerated in
[Testing & Performance §6.2](./testing-and-performance.md#62-test-inventory).

### Continuous validation

The same suite runs on **every push and pull request to `main`** via GitHub Actions against a
health-gated `mongo:7` service container — `.github/workflows/ci.yml`. Lint runs first and gates the
test step, so a style regression stops the job before tests execute. CI history is the continuous
evidence; this chapter is the point-in-time record.

### Reproducing this run

```bash
# 1. a disposable MongoDB
docker run -d --rm -p 27017:27017 --name eh-test mongo:7

# 2. the run
cd backend
MONGO_URI=mongodb://localhost:27017/eventhive_test \
JWT_SECRET=test_secret \
npm run test:coverage

docker stop eh-test
```

Any reachable MongoDB works — a local `mongod`, the Docker service above, or an Atlas test cluster.
The recorded run used an ephemeral in-memory `mongod` for isolation. Three of the four suites require
a database; only `server.test.js` runs without one.

---

## 9.3 Code coverage

Measured by Jest's built-in Istanbul instrumentation during the run in §9.2. Raw artefact:
**`backend/tests/coverage_results.json`** (committed). The HTML/lcov report is written to
`backend/coverage/`, which is gitignored.

### Totals

| Metric | Covered / Total | % |
| :--- | :---: | :---: |
| **Statements** | 204 / 424 | **48.11 %** |
| **Branches** | 62 / 181 | **34.25 %** |
| **Functions** | 18 / 38 | **47.36 %** |
| **Lines** | 200 / 401 | **49.87 %** |

### Per-file breakdown

| File | % Stmts | % Branch | % Funcs | % Lines | Uncovered lines |
| :--- | ---: | ---: | ---: | ---: | :--- |
| `src/server.js` | 69.09 | 50.00 | 50.00 | 69.09 | 61–81, 107–111 |
| `src/config/db.js` | 37.50 | 100.00 | 0.00 | 37.50 | 4–9 |
| `src/middleware/auth.js` | 72.72 | 50.00 | 100.00 | 72.72 | 9, 18–19 |
| `src/models/Booking.js` | **100** | **100** | **100** | **100** | — |
| `src/models/Event.js` | **100** | **100** | **100** | **100** | — |
| `src/models/Notification.js` | **100** | **100** | **100** | **100** | — |
| `src/models/User.js` | **100** | **100** | **100** | **100** | — |
| `src/routes/auth.js` | **12.69** | **0.00** | **0.00** | 13.67 | 17–20, 36–84, 99–136, 145–191, 199–272, 280–309 |
| `src/routes/bookings.js` | 53.33 | 50.00 | 66.66 | 55.17 | 31–83, 109, 140–141, 149–156 |
| `src/routes/events.js` | 60.50 | 53.52 | 70.00 | 63.55 | 22, 25, 91, 96–97, 105–112, 120–139, 154, 174–176, 184–198, 253–254 |
| `src/routes/notifications.js` | 67.74 | 33.33 | 100.00 | 67.74 | 15–16, 31–32, 44, 49, 57–61 |

### Honest reading of these numbers

The headline figure understates the quality of what *is* tested and overstates the risk in parts of
what is not. Three observations:

1. **Coverage is concentrated where the business rules live and absent where the integrations
   live.** All four Mongoose models are at 100 %. The check-in, deadline, age-group and
   notification-fan-out logic — the three non-trivial flows of the system — are covered end to end.

2. **`routes/auth.js` at 12.69 % is the single largest gap, and it is deliberate but not
   costless.** Five of the six uncovered blocks are the **federated identity handlers** — Google
   (`145–191`) and Apple (`199–272`) — which cannot be exercised without live provider tokens or a
   mock JWKS endpoint, plus profile update (`280–309`). But **local registration and login
   (`36–84`, `99–136`) have no automated test either**, and they have no such excuse. That is the
   most valuable next test to write, and it is recorded as such in §9.6.

3. **The uncovered lines elsewhere are predominantly error branches and process lifecycle.**
   `config/db.js:4–9` is the connection-failure exit path; `server.js:61–81, 107–111` is the
   `listen()` block skipped under Supertest by design plus the metrics endpoint; `auth.js:9, 18–19`
   are the missing-token and invalid-token rejections — the latter *are* asserted indirectly by
   `checkin.test.js` case 4.

**No coverage threshold is currently enforced in `jest.config` or CI.** Setting a floor is
recommended in §9.6 so that coverage cannot silently regress.

---

## 9.4 Static analysis

| Field | Value |
| :--- | :--- |
| Tool | ESLint 9.39.2, flat config (`backend/eslint.config.js`) |
| Rule set | `@eslint/js` recommended, with Node and Jest globals declared |
| Scope | `backend/src` |
| Command | `npm run lint` |
| **Result** | ✅ **0 errors, 0 warnings** |
| Enforcement | Runs as the first CI step; gates the test step |

The mobile app has its own ESLint config (`mobile-app/eslint.config.js`, `eslint-config-expo`) but is
**not linted in CI** — see §9.6.

---

## 9.5 Performance & load validation

Full methodology, results, and bottleneck analysis are in
[Testing & Performance §6.3–§6.7](./testing-and-performance.md#63-load-benchmark-methodology). Raw
artefact: `backend/tests/benchmark_results.json`. Summary of the validated findings:

| Validation question | Measured answer | Verdict |
| :--- | :--- | :--- |
| Does the service stay correct under concurrency? | **1,164 / 1,164 requests succeeded** — no timeouts, no 5xx, at every concurrency level on both endpoints | ✅ Pass |
| Does the HTTP layer scale? | `/health`: **7,896 req/s at 200 concurrent**, P95 **25.75 ms**, 100 % success | ✅ Pass |
| Does the data-backed feed scale? | `/api/events`: throughput flat at **3.29–4.23 req/s**; mean latency rises 400 ms → 3,242 ms from 2 → 15 concurrent users | ⚠️ Throughput-limited — cause identified |
| Is the ceiling explained, not just observed? | Yes — ~264 ms serial per-request cost (Atlas round-trip + `host` population round-trip + unindexed sort); 1 / 0.264 s ≈ 3.8 req/s, matching the measurement | ✅ Explained arithmetically |
| Does memory stay bounded? | RSS floor **211.72 MB** measured — above the `256Mi` Kubernetes request currently configured | ⚠️ Config defect, logged as Known Limitation #8 |

> **Provenance caveat carried forward.** Mobile-client figures in
> [§6.5](./testing-and-performance.md#65-mobile-client-performance) are **estimated device-tier
> profiles, not instrumented measurements on physical handsets**, and are labelled as such at
> source. They are not validation evidence and are excluded from the verdict in §9.1.

---

## 9.6 Requirements traceability matrix

Each functional requirement mapped to its implementation and its validating evidence. **Rows marked
⚠️ have no automated test** and were verified only by manual walkthrough — stated so the gap is
visible rather than implied.

| # | Requirement | Implementation | Validated by | Status |
| :---: | :--- | :--- | :--- | :---: |
| R1 | Register with email and password | `routes/auth.js:28` | Manual walkthrough only | ⚠️ |
| R2 | Log in and receive a session token | `routes/auth.js:92` | Manual; token path exercised indirectly by every authenticated test | ⚠️ |
| R3 | Sign in with Google | `routes/auth.js:144` | Manual only — needs live provider tokens | ⚠️ |
| R4 | Sign in with Apple | `routes/auth.js:198` | Manual only — needs live provider tokens | ⚠️ |
| R5 | Update profile | `routes/auth.js:279` | Manual only | ⚠️ |
| R6 | Reject unauthenticated access to protected routes | `middleware/auth.js` | `checkin.test.js` #4 (401 path) | ✅ |
| R7 | Host can create an event | `routes/events.js:13` | `deadlines.test.js` #2, #4 | ✅ |
| R8 | Registration deadline must precede event start | `routes/events.js:13` | `deadlines.test.js` #1 | ✅ |
| R9 | Target age group restricted to the schema enum | `routes/events.js:13` | `deadlines.test.js` #4, #5 | ✅ |
| R10 | Browse the paginated event feed | `routes/events.js:119` | Load benchmark §9.5; no correctness test | ⚠️ |
| R11 | View a single event | `routes/events.js:104` | Exercised transitively by booking tests | ✅ |
| R12 | Host can cancel/delete their own event | `routes/events.js:146` | `notifications.test.js` #6 | ✅ |
| R13 | Book a ticket while registration is open | `routes/bookings.js:20`, `:90` | `deadlines.test.js` #2 | ✅ |
| R14 | Reject a booking after the deadline passes | `routes/bookings.js:20`, `:90` | `deadlines.test.js` #3 — asserted on **both** `/checkout` and `/verify` | ✅ |
| R15 | Attendee can list their bookings | `routes/bookings.js:148` | Manual only | ⚠️ |
| R16 | Host can view the guest list | `routes/events.js:183` | Manual only | ⚠️ |
| R17 | Host can check in a valid ticket by QR | `routes/events.js:205` | `checkin.test.js` #1 | ✅ |
| R18 | A ticket cannot be checked in twice | `routes/events.js:205` | `checkin.test.js` #2 | ✅ |
| R19 | An invalid ticket code is rejected | `routes/events.js:205` | `checkin.test.js` #3 | ✅ |
| R20 | Only the host may check guests in | `routes/events.js:205` | `checkin.test.js` #4 | ✅ |
| R21 | Notify the attendee on booking confirmation | `routes/bookings.js` | `notifications.test.js` #1 | ✅ |
| R22 | Notify both parties on check-in | `routes/events.js:205` | `notifications.test.js` #2 | ✅ |
| R23 | Notify same-city users when an event is published | `routes/events.js:13` | `notifications.test.js` #5 | ✅ |
| R24 | Notify attendees when an event is cancelled | `routes/events.js:146` | `notifications.test.js` #6 | ✅ |
| R25 | Mark one notification / all notifications read | `routes/notifications.js:39`, `:23` | `notifications.test.js` #3, #4 | ✅ |
| R26 | Liveness endpoint for orchestration | `server.js` `/health` | `server.test.js` #1 | ✅ |
| R27 | Passwords stored hashed, never returned | `models/User.js`, `routes/auth.js` | Manual + code review; **no automated assertion** | ⚠️ |

**20 of 27 requirements carry automated evidence. 7 are manual-only** — concentrated in
authentication (R1–R5), read-only listings (R10, R15, R16), and the password-handling invariant
(R27).

---

## 9.7 Recommendations arising from this validation

Ordered by value, and separated from the eight product-level defects already tracked in
[Architecture §1.8](./architecture.md#18-known-limitations--future-work).

| # | Recommendation | Why it follows from the evidence |
| :---: | :--- | :--- |
| V1 | **Add integration tests for local register and login** (R1, R2) | `routes/auth.js` sits at 12.69 % statement coverage; these two paths need no external provider and are the highest-value uncovered code in the repository |
| V2 | **Assert that `password` never appears in any auth response** (R27) | A security invariant claimed in the README with no automated guard; a one-line assertion prevents a silent regression |
| V3 | **Enforce a coverage floor in CI** (e.g. `--coverageThreshold` at the current 48 % statements, ratcheted upward) | Coverage is measured but unenforced, so it can regress unnoticed |
| V4 | **Lint `mobile-app/` in CI** | An ESLint config exists and is unused by the pipeline; the client is entirely unvalidated by CI today |
| V5 | **Add a correctness test for the feed endpoint** (R10) | The most performance-critical endpoint has load evidence but no correctness evidence — filters and pagination are asserted nowhere |
| V6 | **Instrument the mobile client on real hardware** | Would convert the §6.5 estimates into measurements and let them count as validation evidence |
| V7 | **Publish the CI test report as a build artefact** | Makes every run's result durable rather than reconstructable only from log output |

---

## 9.8 Artefact index

| Artefact | Path | Committed |
| :--- | :--- | :---: |
| Test suites | `backend/tests/*.test.js` | ✅ |
| Coverage summary (this run) | `backend/tests/coverage_results.json` | ✅ |
| Load-benchmark harness | `backend/tests/benchmark.js` | ✅ |
| Load-benchmark raw results | `backend/tests/benchmark_results.json` | ✅ |
| CI definition | `.github/workflows/ci.yml` | ✅ |
| CI run history | GitHub Actions → *EventHive CI Pipeline* | External |
| HTML coverage report | `backend/coverage/lcov-report/index.html` | ✗ gitignored — regenerate with `npm run test:coverage` |

---

← [User Manual](./user-manual.md) · [Docs index](./README.md) · Next: [Originality & Compliance](./originality-and-compliance.md)
