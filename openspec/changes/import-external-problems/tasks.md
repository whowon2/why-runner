## 1. Setup

- [ ] 1.1 Add `cheerio` dependency to `web/package.json`
- [ ] 1.2 Create `web/lib/actions/problems/import/` module directory for adapter code

## 2. Adapter interface

- [ ] 2.1 Define `ProblemSourceAdapter` interface (`fetch(ref): Promise<RawExternalProblem>`) and shared types in `web/lib/actions/problems/import/adapter.ts`
- [ ] 2.2 Define adapter registry keyed by source id, with "unsupported source" error for unknown keys

## 3. Codeforces adapter

- [ ] 3.1 Implement contest id/index + URL parsing into a Codeforces problem reference
- [ ] 3.2 Fetch problem metadata (rating, name, tags) from `codeforces.com/api/problemset.problems`
- [ ] 3.3 Fetch and parse the public problem page HTML with `cheerio` to extract statement text and `sample-test` input/output pairs
- [ ] 3.4 Handle unparseable/missing samples by returning empty `inputs`/`outputs` with a warning instead of throwing
- [ ] 3.5 Handle not-found contest id/index with a clear error, no partial draft returned

## 4. Normalization

- [ ] 4.1 Implement rating → `easy | medium | hard | null` mapping per the fixed table in design.md
- [ ] 4.2 Map adapter output into the exact shape of `importSchema` (title, description, difficulty, exampleCount, inputs[], outputs[])

## 5. Server actions

- [ ] 5.1 Add `fetchExternalProblem(source, ref)` server action: admin-auth check, adapter lookup, fetch + normalize, return draft (no DB write)
- [ ] 5.2 Add `confirmExternalProblemImport(draft)` server action: validate draft with `importSchema`, insert via existing `importProblems` insert path (reuse, don't duplicate), attribute to current admin

## 6. UI

- [ ] 6.1 Add "Import from Codeforces" trigger next to the existing JSON `ImportProblems` button in `web/app/[locale]/problems/_components/import.tsx`
- [ ] 6.2 Build a small form for contest id + index (or URL) that calls `fetchExternalProblem`
- [ ] 6.3 Build a preview/edit dialog showing the draft (title, description, difficulty, inputs/outputs) with editable fields before confirm
- [ ] 6.4 Wire confirm button to `confirmExternalProblemImport`, reuse existing success/error toast pattern, invalidate `["problems"]` query on success
- [ ] 6.5 Add i18n strings for the new UI (`en.json`, `br.json`)

## 7. Verification

- [ ] 7.1 Manually import at least one real Codeforces problem end-to-end and confirm it appears correctly in the problems list
- [ ] 7.2 Verify non-admin users cannot call `fetchExternalProblem`/`confirmExternalProblemImport`
- [ ] 7.3 Run `bun lint` and fix any issues in new files
