## Why

Problem authoring is slow — every problem is written by hand (title, statement, difficulty, test I/O) and uploaded via a manual JSON file (`ImportProblems` / `importProblems` action). Growing the problem bank for contests/lessons means writing dozens of problems from scratch. Well-known judges (Codeforces, Kattis, ...) publish large catalogs of vetted problems with public statements and sample test cases that can be fetched and normalized into WhyRunner's existing `problem` schema (`title`, `description`, `difficulty`, `inputs[]`, `outputs[]`, `exampleCount`), cutting authoring time drastically.

## What Changes

- Add a server-side "external problem import" pipeline: given a source (e.g. Codeforces) and a problem reference (contest id + index, or URL), fetch the problem statement and sample tests, normalize into the shape already accepted by `importProblems`, and let the admin preview/edit before insert.
- Add a pluggable source-adapter interface (`ProblemSourceAdapter`) so a first adapter (Codeforces) ships now and others (e.g. Kattis) can be added later without touching the pipeline.
- Only samples published on the public problem page are imported as test cases — no scraping of judge-only/hidden test data (not publicly available and out of scope).
- Difficulty is mapped from source rating/tags to the existing `easy | medium | hard` enum via a documented heuristic; unmappable problems default to `null` (matches current nullable `difficulty`).
- Extend the existing admin "Import Problems" UI with a second entry point: "Import from Codeforces" (by URL or contest/index) alongside the current JSON file upload, reusing the same success/error toast flow.
- Imported problems are attributed to the importing admin (`createdBy`) same as manual imports; source URL is not persisted (no new schema column) — **out of scope for schema changes** in this iteration.

## Capabilities

### New Capabilities

- `external-problem-import`: fetching problem statements + sample tests from supported external judges, normalizing them to WhyRunner's problem format, and inserting via the existing import path with admin preview.

### Modified Capabilities

(none — existing manual JSON import flow is unchanged and untouched)

## Impact

- **Affected code:** `web/lib/actions/problems/` (new fetch/normalize action + adapter), `web/app/[locale]/problems/_components/import.tsx` (new UI trigger), `web/lib/actions/problems/import-problems.ts` (reused, unchanged).
- **New dependency:** an HTML parser for statement/sample scraping (Codeforces has no public samples API) — e.g. `cheerio` (not currently in `web/package.json`).
- **External:** outbound HTTP calls to `codeforces.com` from the Next.js server at import time; subject to that site's rate limits/ToS — must be admin-triggered, on-demand, low volume (not a bulk crawler).
- **No DB schema changes** — reuses the existing `problem` table as-is.
