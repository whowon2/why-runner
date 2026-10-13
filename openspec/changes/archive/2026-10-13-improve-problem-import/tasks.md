## 1. Shared schema module

- [x] 1.1 Confirm `PROBLEM_TAGS` and difficulty values are importable from client code without pulling server-only modules; if not, move/re-export them from a client-safe module
- [x] 1.2 Create `web/lib/problem-import/schema.ts` with strict `problemImportSchema` (all fields from spec incl. `narrative`, `timeLimitMs`, `memoryLimitMb`) and root schema accepting array or `{ problems: [...] }`, normalised to array
- [x] 1.3 Add `superRefine` checks: `outputs.length === inputs.length` (path `outputs`), `exampleCount <= inputs.length` (path `exampleCount`), non-empty root; custom message naming invalid tag values
- [x] 1.4 Add `formatImportIssues(issues, rawData)` → `{ index?, title?, field, message }[]`
- [x] 1.5 Add `IMPORT_FIELDS` descriptor (name, type, required, default, allowed values) and `IMPORT_TEMPLATE` (one full + one minimal problem)
- [x] 1.6 Add `web/lib/problem-import/schema.test.ts` (bun:test): template parses; wrapped root accepted; length mismatch, exampleCount overflow, unknown key, invalid tag, empty payload each produce a located issue; multiple errors all reported
- [x] 1.7 Verify repo-root `problems.json` passes the new schema

## 2. Server action

- [x] 2.1 Rewrite `importProblems` to use the shared schema and return `{ ok: true, count } | { ok: false, errors }` instead of throwing on validation failure
- [x] 2.2 Persist `narrative`, `timeLimitMs`, `memoryLimitMb`; keep `status: "published"`, generated slug/code, `createdBy`, single atomic insert

## 3. Import dialog UI

- [x] 3.1 Add `ImportProblems` i18n strings in `messages/en.json` and `messages/br.json` (dialog title/description, tabs, field descriptions, template button, preview headers, error/limit messages, "Import {count} problems")
- [x] 3.2 Convert `import.tsx` to a `Dialog` triggered by the existing header button
- [x] 3.3 Format section: field reference table from `IMPORT_FIELDS` (tags/difficulty allowed values listed), example JSON with copy button, "Download template" button
- [x] 3.4 Input: Upload tab (file picker, `.json`) and Paste tab (`Textarea`, debounced validation); show JSON syntax errors
- [x] 3.5 Preview: table of parsed problems (index, title, difficulty, tests, examples, tags) or error list in `#N "Title" → field: message` form, capped with "and N more"
- [x] 3.6 Import button disabled unless valid; on submit call action, render server errors if returned, on success toast + invalidate `["problems"]` + close and reset state

## 4. Verification

- [x] 4.1 Run `bun test`, typecheck and lint in `web/`
- [ ] 4.2 Manual check in browser: download template → import succeeds; paste broken payload → all errors located; upload `problems.json` → preview + import works; both locales render
