# 10. Originality & Compliance

*Capstone Project — Declaration of Originality, Plagiarism Compliance, and Licensing*

← [Validation Report](./validation-report.md) · [Docs index](./README.md)

---

## Project identification

| | |
| :--- | :--- |
| **Project** | EventHive — event discovery, hosting and ticketing platform |
| **Team name** | Developer Mindset |
| **Programme** | B.Sc. Computer Science (Online Mode) |
| **Institution** | Birla Institute of Technology and Science, Pilani (BITS Pilani Digital) |
| **Academic year** | 2025–2026 |
| **Internal supervisor** | Dr. Vasavi CS |

### Team members

| Name | Enrolment number | Role |
| :--- | :--- | :--- |
| **Ishan Avasthi** | **2023EBCS640** | **Team Leader** |
| Arjun Ojha | 2023EBCS720 | Member |
| Karan Das A | 2023EBCS642 | Member |
| Rajat Tyagi | 2023EBCS669 | Member |

---

> **Signatures pending.** The declarations in §10.1 and §10.2 are complete; §10.6 must be signed by
> all four team members and counter-signed by the internal supervisor on the submitted copy.

---

## 10.1 Declaration of originality — written documentation

We, the members of team **Developer Mindset** — **Arjun Ojha** (2023EBCS720), **Ishan Avasthi**
(2023EBCS640), **Karan Das A** (2023EBCS642) and **Rajat Tyagi** (2023EBCS669) — students of
**B.Sc. Computer Science (Online Mode)** at the **Birla Institute of Technology and Science,
Pilani (BITS Pilani Digital)**, declare that:

1. The written documentation submitted with this project — the root `README.md`, the technical
   chapters in `docs/`, the User Manual, and the Validation Report — is the original work of this
   team, composed by us for this capstone project.
2. Every idea, figure, measurement, and claim in that documentation is either our own or explicitly
   attributed at the point of use.
3. No part of the documentation has been copied verbatim from any book, paper, website, blog,
   thesis, or another student's submission without quotation and citation.
4. Where the documentation reports measured results, those results are reproducible from committed
   artefacts and a stated procedure — see [Validation Report §9.2](./validation-report.md) and
   [Testing & Performance §6.8](./testing-and-performance.md#68-reproduction-guide). Numbers that
   are **estimated rather than measured are labelled as such** in the source chapter, per the
   provenance table at [Testing & Performance §6.1](./testing-and-performance.md#61-executive-summary).
5. This work has not been submitted, in whole or in part, for any other degree, diploma, or
   qualification at this or any other institution.

---

## 10.2 Declaration of originality — source code

We further declare, in respect of the source code in `backend/` and `mobile-app/`, that:

1. All application source code committed to this repository was written by the team members named
   in §10.1. This covers
   `backend/src/` (server, config, middleware, models, routes), `backend/tests/`,
   `backend/seedEvents.js`, `backend/keep_alive.js`, `mobile-app/src/` (13 screens, navigation,
   contexts, components, constants, services), the `Dockerfile`, the Kubernetes manifests in
   `backend/k8s/`, and the CI workflow in `.github/workflows/ci.yml`.
2. **No source file has been copied from another student, a public repository, a tutorial, or a
   commercial template.** No scaffold beyond the standard generator output described in §10.2.1
   was used.
3. Third-party functionality is obtained exclusively through **declared, unmodified package
   dependencies** installed from the public npm registry and pinned in the committed lockfiles.
   No vendored, patched, or hand-copied library code exists in the repository. Every dependency and
   its licence is enumerated in [`THIRD_PARTY_NOTICES.md`](../THIRD_PARTY_NOTICES.md).
4. The `node_modules/` directories are third-party artefacts, are excluded from the authored-work
   claim, and are ignored by `.gitignore` in the mobile app.

### 10.2.1 Generated scaffolding — disclosed

Two pieces of committed code originate from standard tool output rather than from authorship, and
are disclosed here rather than claimed:

| Artefact | Origin | Status |
| :--- | :--- | :--- |
| `mobile-app/` project skeleton | `create-expo-app` (Expo SDK 54 template) | Boilerplate; substantially replaced. `App.js`, `app.json`, `tsconfig.json` and `scripts/reset-project.js` retain template-derived content. |
| `mobile-app/assets/` default icons/splash | Expo template defaults | Placeholder assets, not authored artwork |

---

## 10.3 Plagiarism compliance — written documentation

Originality of the written documentation was verified by a **documentation self-similarity scan**
across all 13 Markdown files, together with an **external verbatim check** of distinctive sentences
sampled from six chapters.

| Scan | Method | Scope | Result |
| :--- | :--- | :--- | :--- |
| Self-similarity | 8-word shingle detection, prose and full-text passes | 13 Markdown files · 10,887 prose shingles | **0.42 % self-duplication** (0.75 % including code blocks and commands) |
| External verbatim check | Quoted-phrase searches on distinctive sentences | Six chapters | **No verbatim source found** |

The highest overlap between any two documents is **2.53 %**, and the longest passage shared by any
pair is **19 words** — a sentence deliberately restated where the README summarises the architecture
chapter. **No evidence of copied prose was found.**

Full method, per-pair results, limitations and reproduction commands:
[`compliance/similarity-scan-local.md`](./compliance/similarity-scan-local.md). Raw output:
[`compliance/doc-similarity-report.txt`](./compliance/doc-similarity-report.txt). The detector
itself is committed at [`compliance/doc-similarity.js`](./compliance/doc-similarity.js) so the
figures can be regenerated.

### Note on measured figures

Where the documentation reports numbers, those numbers are the output of recorded runs and are
reproducible from committed artefacts — see [Validation Report §9.2](./validation-report.md) and
[Testing & Performance §6.8](./testing-and-performance.md#68-reproduction-guide). Figures that are
estimates rather than measurements are labelled as such at the point of use.

---

## 10.4 Plagiarism compliance — source code

Originality of the source code was verified by a **token-level clone-detection scan** over the
authored source — `backend/src`, `backend/tests` and `mobile-app/src`.

| Field | Value |
| :--- | :--- |
| Tool | jscpd 4.3.0 (Rabin–Karp token-level clone detection) |
| Date | 2026-08-29 |
| Scope | 38 authored JavaScript/JSX files · 6,736 lines · 70,524 tokens |
| Clones found | 29 — 15 cross-file, 14 same-file |
| **Duplicated lines** | **278 (4.13 %)** |
| **Duplicated tokens** | **2,942 (4.17 %)** |

**Every clone reported is between two files inside this repository** — internal repetition of the
team's own patterns, with no imported or externally-derived code detected. 4.13 % sits well below
jscpd's own 10 % default failure threshold. The largest cluster (11 of 29 clones) is test-fixture
arrangement shared across the three database-backed suites; `routes/auth.js` contributes four more
by repeating the "find or create user → sign JWT → shape the response" sequence. Both are
refactoring signals rather than integrity ones.

Raw report: [`compliance/jscpd/jscpd-report.json`](./compliance/jscpd/jscpd-report.json). Narrative
and reproduction command:
[`compliance/similarity-scan-local.md`](./compliance/similarity-scan-local.md).

### Expected structural matches

Framework boilerplate that any clone detector will legitimately flag across a project using this
stack. None of it is copied work:

| Pattern | Where | Why it matches |
| :--- | :--- | :--- |
| Mongoose schema declaration syntax | `backend/src/models/*.js` | Prescribed by the ODM |
| `express.Router()` route registration | `backend/src/routes/*.js` | Framework idiom |
| JWT sign/verify middleware shape | `backend/src/middleware/auth.js` | The canonical `jsonwebtoken` usage |
| React Navigation stack/tab configuration | `mobile-app/src/navigation/` | Library-prescribed structure |
| GitHub Actions `setup-node` + service-container block | `.github/workflows/ci.yml` | Documented Actions pattern |
| Expo template files | `App.js`, `app.json` | Disclosed in §10.2.1 |

---

## 10.5 Licensing and attribution compliance

| Requirement | Status | Evidence |
| :--- | :--- | :--- |
| Project licence declared | ✅ Complete | [`LICENSE`](../LICENSE) — MIT, © 2026 Ishan Avasthi |
| Licence consistent with package metadata | ✅ Complete | `backend/package.json` → `"license": "MIT"` |
| Third-party dependencies enumerated with licences | ✅ Complete | [`THIRD_PARTY_NOTICES.md`](../THIRD_PARTY_NOTICES.md) — 14 backend + 44 mobile direct dependencies |
| Transitive licence audit | ✅ Complete | 577 backend / 1016 mobile tree entries; all permissive or weak-copyleft. No GPL/AGPL. |
| Fonts and icon sets attributed | ✅ Complete | Plus Jakarta Sans (OFL-1.1), Lucide (ISC) — `THIRD_PARTY_NOTICES.md` |
| External services acknowledged | ✅ Complete | MongoDB Atlas, Cloudinary, Razorpay, Google, Apple, Render, GitHub |
| No third-party code vendored into the repo | ✅ Complete | All dependencies resolve from the registry via the lockfiles |
| Secrets excluded from version control | ✅ Complete | `.env` gitignored in both packages; only `EXPO_PUBLIC_*` non-secret values documented |
| Source-code duplication scan | ✅ Complete | jscpd 4.3.0 — 4.13 %, all clones internal, no external code detected (§10.4) |
| Documentation self-similarity scan | ✅ Complete | 0.42 % corpus self-duplication (§10.3) |
| External verbatim check | ✅ Complete | No verbatim source found (§10.3) |

---

## 10.6 Signatures

We certify that the declarations in §10.1 and §10.2 are true, that the similarity results recorded
in §10.3 and §10.4 are the unaltered output of the named tools, and that we understand the
consequences of a false declaration under the institution's academic-integrity policy.

**Programme:** B.Sc. Computer Science (Online Mode) · **Institution:** Birla Institute of Technology
and Science, Pilani (BITS Pilani Digital) · **Academic year:** 2025–2026

| Candidate | Enrolment number | Role | Signature | Date |
| :--- | :--- | :--- | :--- | :--- |
| Ishan Avasthi | 2023EBCS640 | Team Leader | ______________________ | ____________ |
| Arjun Ojha | 2023EBCS720 | Member | ______________________ | ____________ |
| Karan Das A | 2023EBCS642 | Member | ______________________ | ____________ |
| Rajat Tyagi | 2023EBCS669 | Member | ______________________ | ____________ |

**Internal supervisor**

| | |
| :--- | :--- |
| **Name** | Dr. Vasavi CS |
| Designation | Internal Supervisor |
| Institution | Birla Institute of Technology and Science, Pilani (BITS Pilani Digital) |
| Signature | ______________________ |
| Date | ____________ |

---

← [Validation Report](./validation-report.md) · [Docs index](./README.md)
