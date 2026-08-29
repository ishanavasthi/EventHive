# Similarity Scan — Local Report

*EventHive · Team Developer Mindset · scans performed 2026-08-29*

← [Originality & Compliance](../originality-and-compliance.md) · [Docs index](../README.md)

---

## Method

Three checks were run to verify the originality of the submitted work:

1. **Source-code duplication** — token-level clone detection over the authored source.
2. **Documentation self-similarity** — shingle-based near-duplicate detection across the whole
   Markdown corpus.
3. **External verbatim check** — quoted-phrase searches on distinctive sentences sampled from six
   chapters.

Scans 1 and 2 are exhaustive over their corpora and fully reproducible from the commands in this
report. Scan 3 is a sampled check rather than an exhaustive one, and is reported as such.

---

## Scan 1 — Source-code duplication (jscpd)

**Question answered:** is there copy-pasted code within the authored source?

| Field | Value |
| :--- | :--- |
| Tool | `jscpd` 4.3.0 |
| Command | `npx jscpd@4 backend/src backend/tests mobile-app/src --min-tokens 50 --min-lines 5 --format javascript,jsx` |
| Detection | Rabin–Karp token-level clone detection |
| Scope | 38 authored JavaScript/JSX files — `backend/src`, `backend/tests`, `mobile-app/src` |
| Date | 2026-08-29 |
| Raw report | [`jscpd/jscpd-report.json`](./jscpd/jscpd-report.json) |

### Result

| Metric | Value |
| :--- | ---: |
| Files analysed | 38 |
| Total lines | 6,736 |
| Total tokens | 70,524 |
| **Clones found** | **29** |
| **Duplicated lines** | **278 (4.13 %)** |
| **Duplicated tokens** | **2,942 (4.17 %)** |

**4.13 % internal duplication is a healthy figure.** For reference, jscpd's own default failure
threshold is 10 %; codebases above ~15 % are usually considered to have a copy-paste problem.

### Where the duplication is

| Count | Location |
| :---: | :--- |
| 5 | `tests/checkin.test.js` ↔ `tests/notifications.test.js` |
| 4 | `src/routes/auth.js` (internal) |
| 2 | `ManageEventScreen.js` ↔ `TicketScreen.js` |
| 2 | `tests/deadlines.test.js` ↔ `tests/notifications.test.js` |
| 2 | `tests/checkin.test.js` ↔ `tests/deadlines.test.js` |
| 2 | `tests/benchmark.js` (internal) |
| 2 | `src/routes/events.js` (internal) |
| 1 each | `NotificationsScreen`↔`TicketScreen` · `LoginScreen`↔`RegisterScreen` · `HomeScreen` (internal) · `HomeScreen`↔`NotificationsScreen` · `CreateEventScreen`↔`RegisterScreen` · `CreateEventScreen` (internal) · `AuthContext` (internal) · `deadlines.test` (internal) · `checkin.test` (internal) · `bookings.js` (internal) |

**15 cross-file clones, 14 same-file clones.** Every clone is between two files *inside this
repository* — jscpd by construction reports nothing about external sources.

### Interpretation

1. **The largest cluster (11 of 29 clones) is test-fixture setup.** The three database-backed suites
   each create a host, an attendee, an event and a booking before asserting. That is duplicated
   arrangement code, not duplicated logic — the conventional fix is a shared fixture helper, and its
   absence is a mild code-quality observation, not an integrity one.
2. **`routes/auth.js` accounts for 4 internal clones** — the register/login handlers and the
   Google/Apple handlers repeat the same "find or create user → sign JWT → shape the response"
   sequence four times. This is the same file already flagged at 12.69 % test coverage in
   [Validation Report §9.3](../validation-report.md). It is the clearest refactor target in the
   backend.
3. **The mobile clones are styling and layout blocks** shared between screens (`StyleSheet.create`
   bodies, gradient/card wrappers) — the standard consequence of not extracting a shared style
   module.

**Integrity verdict: no evidence of copy-pasted external code.** All 29 clones are internal
repetition of the author's own patterns, which is a refactoring signal rather than a plagiarism one.

---

## Scan 2 — Documentation near-duplicate detection

**Question answered:** is the documentation set padded by repeating itself?

| Field | Value |
| :--- | :--- |
| Tool | Purpose-written 8-word shingle detector — [`doc-similarity.js`](./doc-similarity.js) |
| Method | Text normalised (links flattened to their text, tables and Markdown syntax stripped); 8-word shingles; pairwise containment against the smaller document, plus Jaccard and longest verbatim common run |
| Scope | 13 Markdown files — `README.md`, `mobile-app/README.md`, all of `docs/` |
| Variants | Run twice: prose only (code fences excluded) and full text (code, commands and tables included) |
| Date | 2026-08-29 |
| Raw output | [`doc-similarity-report.txt`](./doc-similarity-report.txt) |

### Result

| Metric | Prose only | Including code & commands |
| :--- | ---: | ---: |
| Distinct 8-word shingles across the corpus | 10,887 | 15,881 |
| Shingles appearing in more than one document | **46** | **119** |
| **Corpus self-duplication rate** | **0.42 %** | **0.75 %** |

### Highest pairwise overlaps

| Containment | Pair | Longest verbatim run |
| ---: | :--- | :--- |
| 2.53 % | `mobile-app/README.md` ↔ `docs/mobile-app.md` | 10 words |
| 2.30 % | `README.md` ↔ `docs/architecture.md` | 19 words |
| 1.27 % | `README.md` ↔ `mobile-app/README.md` | 9 words |
| 0.70 % | `docs/setup-and-deployment.md` ↔ `docs/testing-and-performance.md` | 12 words |
| 0.59 % | `docs/testing-and-performance.md` ↔ `docs/validation-report.md` | 9 words |

The single longest verbatim passage shared between any two documents is **19 words**, and it is a
sentence deliberately restated in the README summary of the architecture chapter. No pair exceeds
2.53 % containment.

### A prediction this scan disproved

[§10.3](../originality-and-compliance.md#103-plagiarism-compliance--written-documentation) warns that
README-to-`docs/` self-similarity might register as significant internal duplication, since the
README summarises material covered in full in `docs/`. **Measurement contradicts that at
0.42 %** — the README paraphrases rather than copies, and the overlap is negligible. That caveat has
been corrected in §10.3 rather than left standing as an untested assumption.

---

## Scan 3 — External verbatim check (public web)

**Question answered:** does distinctive prose from the documentation appear verbatim online?

| Field | Value |
| :--- | :--- |
| Method | Quoted-phrase web searches on distinctive sentences sampled across six chapters |
| Sample size | 7 phrase queries + 1 project-name query |
| Date | 2026-08-29 |

> **Scope, stated plainly.** This is a sampled check of 8 queries, not an exhaustive index over the
> full document. The search backend does not strictly enforce quoted-phrase matching, so a null
> result is supporting evidence rather than proof.

### Result

**No verbatim source was found for any sampled sentence.** Every query returned only topically
related pages — general articles on booking commissions, mobile/REST architecture, and database
concurrency — with no page reproducing the sampled wording.

### Two findings worth acting on

**Finding A — an uncited standard result.**
[Testing & Performance §6.4.1](../testing-and-performance.md#641-bottleneck-analysis) derives that
the throughput ceiling is the reciprocal of the per-request service cost (1 / 0.264 s ≈ 3.8 req/s).
The derivation in the document is the author's own and is arithmetically sound — **but it restates
the standard *bottleneck law* of operational analysis** (X_max = 1/D_max, Denning & Buzen, 1978;
discussed in Gunther, *Benchmarking Blunders and Things That Go Bump in the Night*, arXiv:cs/0404043),
which the surrounding text presents without citation. The related claim that latency growth "follows
Little's Law" *is* named in the text, so the omission is inconsistent rather than deliberate.

This is **not plagiarism** — no wording was taken. But an examiner in a viva is likely to ask
whether the candidate knows the result is textbook, and an uncited restatement of a named law reads
better as a cited one.

> ✅ **Resolved.** The citation was added to
> [§6.4.1](../testing-and-performance.md#641-bottleneck-analysis) — the bottleneck law of
> operational analysis, `X_max ≤ 1 / D_max` (Denning & Buzen, 1978), with the Gunther reference
> alongside.

**Finding B — the project name is not unique.**
Two unrelated public GitHub projects also use the name *EventHive*:
`ItsRoy69/EventHive` (luxury event planning) and `VishalRMahajan/EventHive` (a Python college
ticket-booking site). Neither shares this project's stack — one is Python — so there is **no
code-similarity exposure**. Recorded here for completeness.

---

## Consolidated verdict

| Scan | Scope | Result | Verdict |
| :--- | :--- | :--- | :--- |
| jscpd 4.3.0 | 38 files, 6,736 lines of authored source | 4.13 % duplicated lines, all internal | ✅ No external copy-paste evidence; refactor targets identified |
| Shingle detector | 13 Markdown files, 10,887 prose shingles | 0.42 % self-duplication, longest shared run 19 words | ✅ Documentation is not padded or self-plagiarised |
| Web verbatim check | 8 queries across 6 chapters | No verbatim source found | ✅ No verbatim external match in the sample |

**Nothing in these scans indicates plagiarism.**

### Reproducing these scans

```bash
# Scan 1 — code duplication
npx jscpd@4 backend/src backend/tests mobile-app/src \
  --min-tokens 50 --min-lines 5 --format "javascript,jsx" \
  --reporters json,console --output docs/compliance/jscpd

# Scan 2 — documentation self-similarity (edit ROOT at the top of the script first)
node docs/compliance/doc-similarity.js
```

---

← [Originality & Compliance](../originality-and-compliance.md) · [Docs index](../README.md)
