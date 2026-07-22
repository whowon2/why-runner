## Context

WhyRunner's only current problem-ingestion path is `importProblems` (`web/lib/actions/problems/import-problems.ts`): a Zod-validated bulk insert from an admin-uploaded JSON file (`ImportProblems` client component). Problems store test data as plain `inputs[]`/`outputs[]` string arrays with an `exampleCount`, no reference solution or checker. There is no existing outbound-HTTP or scraping code in `web/` — this change introduces both.

Codeforces is the target source for the first adapter: it has a stable public REST API (`codeforces.com/api/problemset.problems`) for problem metadata (name, rating, tags, contestId/index) but that API does **not** return statement text or sample tests — those exist only on the public HTML problem page (`codeforces.com/problemset/problem/{contestId}/{index}`). So the adapter must combine the API (for metadata/rating) with HTML parsing of the problem page (for statement + `<div class="sample-test">` input/output pairs).

## Goals / Non-Goals

**Goals:**
- Let an admin import a single Codeforces problem by contest id + index (or a pasted problem URL) into the existing `problem` table, reusing `importProblems`' validation/insert path.
- Give the admin a preview/edit step before commit — scraped statements are messy HTML-to-text and need a human check.
- Keep the source integration behind an adapter interface so a second source doesn't require touching the pipeline, action, or UI beyond registering the adapter.

**Non-Goals:**
- No bulk/background crawling of an entire problem archive — one problem per admin action, on demand.
- No scraping of hidden/judge-only test data — only publicly displayed samples.
- No new DB columns (e.g. `sourceUrl`, `sourceId`) in this iteration — dedup/provenance tracking is deferred.
- No support for sources requiring auth or that prohibit scraping in their ToS (rules out LeetCode).

## Decisions

**Adapter interface over one-off Codeforces script.** Define `ProblemSourceAdapter` (`fetch(ref) -> RawExternalProblem`) in `web/lib/actions/problems/import/` so Kattis (which does offer a downloadable `.zip` of samples per problem) can be added later as a second adapter without reshaping the pipeline. Alternative considered: hardcode Codeforces-only logic directly in the server action — rejected because the proposal explicitly calls for a source-agnostic pipeline and the marginal cost of the interface is small.

**HTML parsing via `cheerio`.** Codeforces gives no samples API; the problem page is server-rendered static HTML, so a jQuery-like DOM selector library run server-side is the standard approach (same technique CF-focused OSS tools use). Alternative: regex-scraping raw HTML — rejected as fragile against markup changes.

**Reuse `importProblems`'s Zod schema as the normalization target.** The adapter's output is mapped into the exact shape `importSchema` already accepts (`title, description, difficulty, exampleCount, inputs[], outputs[]`), then passed through the existing insert path unchanged. This avoids a second insert code path and keeps `createdBy`/`slug` generation identical between manual and external imports.

**Difficulty mapping via a fixed rating table.** CF `rating` (800–3500) maps to `easy` (≤1200), `medium` (1300–1900), `hard` (≥2000); missing rating → `null`. Documented as a constant, not configurable — simplest thing that satisfies "map to existing enum" without over-engineering a settings UI.

**Preview-before-insert, not direct insert.** Fetch returns the normalized draft to the client for the admin to review/edit fields (statement text after HTML-to-markdown conversion is inherently lossy); a second explicit "confirm" action performs the actual `importProblems` call. Alternative: insert immediately on fetch — rejected, matches the proposal's requirement for admin preview and avoids silently persisting garbled scrape output.

## Risks / Trade-offs

- [Codeforces HTML structure changes] → adapter is isolated behind the interface; failure surfaces as a clear "couldn't parse problem page" error rather than corrupting data, since insert only happens after explicit confirm.
- [Statement HTML→text conversion loses LaTeX/formatting] → explicitly scoped as admin-editable preview, not auto-published.
- [Outbound scraping seen as abusive by target site] → action is single-problem, admin-triggered, no scheduled/bulk crawling; add a basic timeout and a descriptive User-Agent.
- [Sample block markup varies (multiple `<pre>` per test, HTML entities)] → parse defensively, fall back to zero samples + inline warning rather than throwing, so the admin can still fill inputs/outputs by hand in the preview step.

## Migration Plan

Additive only — new files, one new npm dependency (`cheerio`), no schema/migration, no changes to the existing manual-import path. Ships behind the existing admin-only problems UI (no separate flag needed, same auth gate as `importProblems`).

## Open Questions

- Should imported problems record provenance (source + external id) for future dedup/re-sync? Deferred — would need a schema change, out of scope here.
