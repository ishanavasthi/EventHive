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
| Arjun Ojha | 2023EBCS720 | Member |
| **Ishan Avasthi** | **2023EBCS640** | **Team Leader** |
| Karan Das A | 2023EBCS642 | Member |
| Rajat Tyagi | 2023EBCS669 | Member |

---

> ### ⚠️ Action required before submission
>
> This chapter is a **declaration plus a compliance record**. Two things must be completed before
> this document is submission-ready, and both are listed in
> [§10.7](#107-outstanding-actions-before-submission):
>
> 1. **The institutional similarity scans have not been run.** No Turnitin / Drillbit / iThenticate
>    report exists for the written documentation, and no MOSS / JPlag report exists for the source
>    code. The procedure to produce them is in §10.3 and §10.4; those results tables are empty
>    placeholders.
>    **Local scans *have* been run** — code duplication and documentation self-similarity, both with
>    real measured results — and are reported in §10.3.1, §10.4.1 and
>    [`compliance/similarity-scan-local.md`](./compliance/similarity-scan-local.md). They do not
>    replace the institutional scans.
> 2. **Signatures** — §10.6 must be signed by all four team members and counter-signed by the
>    internal supervisor, per the institution's rules.
>
> Nothing in this file asserts a scan result that has not been produced.

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

**Status: NOT YET PERFORMED.** No similarity report has been generated.

### Procedure

1. Assemble the submission document (the compiled report, or a concatenation of `README.md` and
   `docs/*.md` exported to PDF/DOCX).
2. Submit it to the institution's similarity checker — typically **Turnitin**, **Drillbit**, or
   **iThenticate** — via the department's submission portal.
3. Configure the scan to **exclude quotes and the bibliography**, and, where the tool supports it,
   to exclude the fenced code blocks — an unfiltered scan of a technical document flags shared
   API names, shell commands, JSON keys, and dependency names as matches, inflating the score.
4. Archive the resulting report PDF at `docs/compliance/similarity-report-document.pdf` and record
   the outcome in the table below.

### Result

| Field | Value |
| :--- | :--- |
| Tool used | ‹FILL› |
| Date of scan | ‹FILL› |
| Document scanned | ‹FILL› |
| Overall similarity index | ‹FILL› % |
| Institutional threshold | ‹FILL› % |
| Verdict | ‹FILL: Pass / Revise› |
| Report artefact | ‹FILL: path or portal reference› |

### Known benign sources of similarity

Declared in advance so they can be excluded or explained if flagged:

- **Standard technical vocabulary and command lines** — `npm install`, `docker build -t …`,
  `kubectl apply -f`, HTTP status-code descriptions, Mongoose/Express API names.
- **Dependency names and versions** reproduced in `THIRD_PARTY_NOTICES.md` and the tech-stack tables.
- **The MIT licence text** in `LICENSE`, which is verbatim by definition and must be excluded.
- ~~**Self-similarity** across the repository, since the root `README.md` summarises material that
  appears in full in `docs/`.~~ **Measured and disproved** — see §10.3.1. Internal duplication across
  the documentation set is **0.42 %**, and the longest passage shared by any two documents is
  19 words. The README paraphrases rather than copies, so this is not a material source of
  similarity after all.

### 10.3.1 Preliminary local scan — performed

A documentation self-similarity scan **was run on 2026-08-29** using a purpose-written 8-word shingle
detector over all 13 Markdown files (`README.md`, `mobile-app/README.md`, `docs/`).

| Metric | Prose only | Including code & commands |
| :--- | ---: | ---: |
| Distinct 8-word shingles | 10,887 | 15,881 |
| Appearing in more than one document | 46 | 119 |
| **Self-duplication rate** | **0.42 %** | **0.75 %** |

Highest pairwise overlap: **2.53 %** (`mobile-app/README.md` ↔ `docs/mobile-app.md`). Longest
verbatim passage shared between any two documents: **19 words**.

An **external verbatim spot-check** of 8 quoted-phrase web searches across six chapters returned
**no verbatim source** for any sampled sentence. That is a smoke test over a small sample, not a
similarity index — it does not clear the document.

> **One actionable finding.** The spot-check surfaced that
> [Testing & Performance §6.4.1](./testing-and-performance.md#641-bottleneck-analysis) restates the
> standard **bottleneck law** of operational analysis (X_max = 1/D_max; Denning & Buzen, 1978)
> without citing it, while the neighbouring Little's Law reference *is* named. The derivation is the
> author's own and no wording was taken, so this is not plagiarism — but an uncited restatement of a
> named law is worth fixing before a viva. ✅ **Resolved** — the citation was added to §6.4.1.

Full report, method, limitations and reproduction commands:
[`compliance/similarity-scan-local.md`](./compliance/similarity-scan-local.md).

---

## 10.4 Plagiarism compliance — source code

**Status: NOT YET PERFORMED.** No code-similarity report has been generated.

### Procedure

1. Export the authored source only — exclude `node_modules/`, lockfiles, and `mobile-app/assets/`:

   ```bash
   cd /path/to/EventHive
   git archive --format=zip HEAD \
     backend/src backend/tests backend/seedEvents.js backend/keep_alive.js \
     mobile-app/src .github/workflows \
     -o eventhive-authored-source.zip
   ```

   `git archive` from `HEAD` inherently excludes everything gitignored, which is the correct
   boundary for the originality claim.
2. Submit the archive to **MOSS** (Stanford, `moss.pl -l javascript`) or **JPlag**
   (`--language javascript`), or to whichever checker the department mandates.
3. Archive the report at `docs/compliance/similarity-report-code.pdf` and record the outcome below.

### Result

| Field | Value |
| :--- | :--- |
| Tool used | ‹FILL: MOSS / JPlag / other› |
| Date of scan | ‹FILL› |
| Files submitted | ‹FILL: count› |
| Comparison corpus | ‹FILL: e.g. current cohort submissions› |
| Highest match | ‹FILL› % against ‹FILL› |
| Verdict | ‹FILL: Pass / Investigate› |
| Report artefact | ‹FILL: path or portal reference› |

### 10.4.1 Preliminary local scan — performed

A source-code duplication scan **was run on 2026-08-29** with **jscpd 4.3.0** (Rabin–Karp token-level
clone detection) over the 38 authored JavaScript/JSX files in `backend/src`, `backend/tests` and
`mobile-app/src`.

| Metric | Value |
| :--- | ---: |
| Files analysed | 38 |
| Total lines / tokens | 6,736 / 70,524 |
| Clones found | 29 (15 cross-file, 14 same-file) |
| **Duplicated lines** | **278 (4.13 %)** |
| **Duplicated tokens** | **2,942 (4.17 %)** |

**Every clone is between two files inside this repository** — internal repetition, not imported
code. 4.13 % is well under jscpd's own 10 % default failure threshold. The largest cluster (11 of
29) is test-fixture arrangement shared across the three database-backed suites; `routes/auth.js`
contributes 4 more by repeating the "find or create user → sign JWT → shape response" sequence.
Both are refactoring signals, not integrity ones.

Raw report: [`compliance/jscpd/jscpd-report.json`](./compliance/jscpd/jscpd-report.json). Narrative:
[`compliance/similarity-scan-local.md`](./compliance/similarity-scan-local.md).

> **This does not substitute for the cohort scan in §10.4.** jscpd compares files against each other
> *within* the submission; it has no corpus of peer submissions and can say nothing about them.
> JPlag could not be run here (no Java runtime, and with a single submission and no cohort corpus it
> would have nothing to compare against). MOSS requires a user ID issued by email registration to a
> named academic.

### Expected structural matches

Boilerplate that a code-similarity tool will legitimately flag across any submission using the same
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
| Local code-duplication scan | ✅ Complete | jscpd 4.3.0 — 4.13 % internal, no external copy-paste evidence (§10.4.1) |
| Local documentation self-similarity scan | ✅ Complete | 0.42 % corpus self-duplication (§10.3.1) |
| External verbatim spot-check | ✅ Complete | 8 queries, no verbatim source found (§10.3.1) — a smoke test, not a clearance |
| **Institutional** document similarity report | ❌ **Outstanding** | §10.3 |
| **Institutional / cohort** code similarity report | ❌ **Outstanding** | §10.4 |

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

## 10.7 Outstanding actions before submission

| # | Action | Section | Owner |
| :---: | :--- | :--- | :--- |
| 1 | Run the **institutional** document similarity scan and record the result *(local scan done — §10.3.1)* | §10.3 | Team |
| 2 | Run the **cohort** code similarity scan and record the result *(local scan done — §10.4.1)* | §10.4 | Team |
| 3 | Collect signatures from all four team members | §10.6 | Team |
| 4 | Obtain the internal supervisor's counter-signature | §10.6 | Dr. Vasavi CS |
| 5 | Archive both institutional similarity reports under `docs/compliance/` *(directory now exists and holds the local scan artefacts)* | §10.3, §10.4 | Team |
| ~~6~~ | ~~Cite the bottleneck law in Testing & Performance §6.4.1~~ — ✅ done | §10.3.1 | — |

---

← [Validation Report](./validation-report.md) · [Docs index](./README.md)
