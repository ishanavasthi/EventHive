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
| An evaluator with 10 minutes | [Architecture](./architecture.md) → [Testing & Performance](./testing-and-performance.md) |
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
│   ├── tests/               Jest + Supertest suites, load benchmark harness
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
└── .github/workflows/       CI/CD pipeline
```

---

## Conventions used in these docs

- Code paths are given relative to the repository root, e.g. `backend/src/routes/events.js:42`.
- **Measured** numbers come from `backend/tests/benchmark_results.json`, a committed artefact of an
  actual benchmark run. **Estimated** numbers (mobile device profiles) are labelled as such.
- Known limitations are stated plainly rather than omitted; see the *Known Limitations & Future
  Work* section at the end of [Architecture](./architecture.md#18-known-limitations--future-work).
