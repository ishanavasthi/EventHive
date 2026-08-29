# EventHive — Documentation

Technical documentation for **EventHive**, a full-stack event discovery, hosting, and ticketing
platform built as a B.Sc. Computer Science capstone project.

The system is a **React Native (Expo) mobile client** talking to a **Node.js / Express REST API**
backed by **MongoDB**, containerised with Docker, deployed via a GitHub Actions CI/CD pipeline to
Kubernetes and Render.

---

## Start here

| If you are… | Read this |
| :--- | :--- |
| An evaluator with 10 minutes | [Architecture](./architecture.md) → [Validation Report](./validation-report.md) |
| Checking submission compliance | [Validation Report](./validation-report.md) → [Originality & Compliance](./originality-and-compliance.md) |
| Using the app as an attendee or host | [User Manual](./user-manual.md) |
| Setting the project up locally | [Setup & Deployment](./setup-and-deployment.md) |
| Reviewing the data model | [Database](./database.md) |
| Reviewing the server logic | [Backend](./backend.md) → [API Reference](./api-reference.md) |
| Reviewing the client | [Mobile App](./mobile-app.md) |

---

## Table of contents

### [1. Architecture](./architecture.md)
System topology, the request lifecycle, component responsibilities, key design decisions and the
trade-offs behind them.

### [2. Database](./database.md)
The four Mongoose collections (`User`, `Event`, `Booking`, `Notification`), their fields,
constraints, relationships, and the indexing situation.

### [3. Backend](./backend.md)
Express application structure, middleware chain, the authentication model, and walkthroughs of the
three non-trivial flows: **booking**, **QR check-in**, and **notification fan-out**.

### [4. API Reference](./api-reference.md)
All 20 HTTP endpoints — method, path, auth requirement, request body, response shape, error codes.

### [5. Mobile App](./mobile-app.md)
Navigation graph, the 13 screens, state management via React Context, the design system, and the
client-side performance work.

### [6. Testing & Performance](./testing-and-performance.md)
The 16 automated integration tests, the load-benchmark methodology, measured latency/throughput
results, the bottleneck analysis, and mobile device profiling.

### [7. Setup & Deployment](./setup-and-deployment.md)
Prerequisites, environment variables, running locally, seeding demo data, Docker, Kubernetes, and
the GitHub Actions pipeline.

### [8. User Manual](./user-manual.md)
The end-user guide — creating an account, discovering and booking events, the QR ticket, hosting an
event, door check-in, troubleshooting, and the behaviours a user will actually notice.

### [9. Validation Report](./validation-report.md)
The dated verification record: the 16/16 test-execution result, measured code coverage, static
analysis, performance validation, a 27-row requirements traceability matrix, and the recommendations
that follow from it.

### [10. Originality & Compliance](./originality-and-compliance.md)
Declaration of originality for document and code, the plagiarism-scan procedure and result tables,
disclosed scaffolding and AI assistance, and the licensing/attribution compliance checklist.

> ⚠️ Chapter 10 has **outstanding actions**. Local similarity scans have been run and are reported
> in [`compliance/similarity-scan-local.md`](./compliance/similarity-scan-local.md) — 4.13 % code
> duplication (all internal), 0.42 % documentation self-duplication. The **institutional** scans,
> the AI-assistance disclosure and the signatures are still required. See
> [§10.7](./originality-and-compliance.md#107-outstanding-actions-before-submission).

---

## Repository layout

```
EventHive/
├── backend/                 Node.js + Express REST API
│   ├── src/
│   │   ├── server.js        App entrypoint, middleware, metrics collector
│   │   ├── config/db.js     Mongoose connection
│   │   ├── middleware/      JWT verification
│   │   ├── models/          Mongoose schemas (User, Event, Booking, Notification)
│   │   └── routes/          auth, events, bookings, notifications
│   ├── tests/               Jest + Supertest suites, load benchmark + coverage artefacts
│   ├── k8s/                 Deployment + Service manifests
│   ├── seedEvents.js        Demo data seeder (3 hosts, 18 events)
│   ├── keep_alive.js        Render cold-start ping
│   └── Dockerfile
├── mobile-app/              React Native (Expo SDK 54) client
│   └── src/
│       ├── screens/         13 screens
│       ├── navigation/      React Navigation stack + tab graph
│       ├── context/         AuthContext, NotificationContext
│       ├── components/      Reusable UI (GlassCard, GradientButton, …)
│       ├── constants/       Design tokens (colours, sizes, typography)
│       └── services/api.js  Axios instance with dynamic base-URL resolution
├── docs/                    ← you are here
│   └── compliance/          Similarity-scan artefacts and reports
├── LICENSE                  MIT
├── THIRD_PARTY_NOTICES.md   Dependency licences and attributions
└── .github/workflows/       CI/CD pipeline
```

---

## Conventions used in these docs

- Code paths are given relative to the repository root, e.g. `backend/src/routes/events.js:42`.
- **Measured** numbers come from `backend/tests/benchmark_results.json` and
  `backend/tests/coverage_results.json`, committed artefacts of actual runs. **Estimated** numbers (mobile device profiles) are labelled as such.
- Known limitations are stated plainly rather than omitted; see the *Known Limitations & Future
  Work* section at the end of [Architecture](./architecture.md#18-known-limitations--future-work).
