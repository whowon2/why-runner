## Context

Today `ImportProblems` (`web/app/[locale]/problems/_components/import.tsx`) is a button wired to a hidden `<input type="file">`. It `JSON.parse`s the file and calls the `importProblems` server action, whose Zod schema (`web/lib/actions/problems/import-problems.ts`) is the only definition of the format. Errors surface as a toast containing `parsed.error.issues[0].message` — no path, no problem index. The schema doesn't check `inputs`/`outputs` length parity or `exampleCount` bounds, ignores `timeLimitMs`/`memoryLimitMb`/`narrative`, and Zod's default `strip` mode silently drops typo'd keys. `problems.json` at the repo root is the only real example and isn't linked from the UI.

Existing requirements that must keep holding: imported problems are `published` with a generated code (`problem-lifecycle`), tags are validated against the taxonomy (`problem-tags`).

## Goals / Non-Goals

**Goals:**
- One schema, used by both the client preview and the server action.
- Users can learn the format, get a template, and see every error with its location before anything is written.
- Catch the silent-corruption cases (length mismatch, exampleCount, unknown keys).

**Non-Goals:**
- Changing the published-on-import behaviour, or routing imports through draft + validation run.
- Other formats (YAML, Polygon/Codeforces packages, ZIP with test files).
- Duplicate detection against existing problems, partial imports, editing entries in the dialog.
- Export of problems to JSON.

## Decisions

**Shared schema module `web/lib/problem-import/schema.ts`.** Plain module (no `"use server"`, no DB imports) exporting the Zod schema, the inferred type, a `formatImportIssues(issues, data)` helper and the template object. Client imports it for preview; the server action imports it for authoritative validation. *Alternative:* call the server action for a dry-run validation — rejected: extra round-trip per keystroke/paste and needs auth for something that's pure.

**Field reference generated from a static descriptor, not introspected from Zod.** A small `IMPORT_FIELDS` array (name, type label, required, default, allowed values) next to the schema; tags/difficulty allowed values read from `PROBLEM_TAGS` / the difficulty enum so they can't drift. *Alternative:* derive docs via `z.toJSONSchema` — tempting but produces machine-ish output and i18n is awkward; descriptor is ~10 entries. Field descriptions go through next-intl (`ImportProblems.fields.<name>`).

`PROBLEM_TAGS` must be importable client-side; if `@/drizzle/schema` pulls server-only code into the client bundle, move/re-export the tag constant from a client-safe module.

**Schema shape.**
- Root: `z.union([z.array(problemSchema), z.object({ problems: z.array(problemSchema) }).strict()])` normalised to the array.
- `problemSchema` uses `.strict()` so unknown keys produce `unrecognized_keys` issues.
- Cross-field checks in `.superRefine`: `outputs.length === inputs.length` (issue at `outputs`), `exampleCount <= inputs.length` (issue at `exampleCount`).
- `timeLimitMs`: int 100–10000, default 1000; `memoryLimitMb`: int 16–1024, default 512 (DB defaults; bounds chosen as sane, adjustable).
- Tags: `z.enum(PROBLEM_TAGS)` with a custom error message naming the bad value.

**Error formatting.** `formatImportIssues` maps each Zod issue's `path` (`[i, "tags", 0]`) to `{ index, title?, field: "tags[0]", message }`; title is looked up from the raw input at `i` when it's a string. UI renders `#{index+1} "{title}" → {field}: {message}`. Root-level issues (not an array, empty) render without a problem prefix. Cap rendered list (e.g. first 50 + "and N more") to keep the dialog usable.

**Server action returns a result, not throws.** `importProblems(data): Promise<{ ok: true; count } | { ok: false; errors: ImportIssue[] }>`. Insert stays one `db.insert(problem).values([...])` (single statement = atomic). Code generation stays per-row via `generateProblemCode()`.

**Dialog UI.** shadcn `Dialog` with `Tabs`: "Upload" (dropzone/file button) and "Paste" (`Textarea`), plus a collapsible "Format" section (field table + example in a `<pre>` with copy button) and a "Download template" button (Blob + `URL.createObjectURL`, filename `whyrunner-problems-template.json`). Below input: preview table or error list. Footer: Cancel / "Import N problems" (disabled unless valid, spinner while pending). Validation runs on file load and on paste (debounced). On success: toast, invalidate `["problems"]` (per `mutation-cache-invalidation` skill — check whether a hook wrapper is expected), close and reset.

**Template content.** Two small problems covering required + every optional field (one with tags/limits/narrative, one minimal). Lives in the schema module so a unit test can assert `schema.safeParse(TEMPLATE).success`.

## Risks / Trade-offs

- [`.strict()` breaks files that relied on extra keys being ignored, e.g. ones carrying `id` or `slug`] → error message names the key so the fix is obvious; `problems.json` in repo has only known keys (verify during implementation).
- [Large pasted payloads (hundreds of problems with big test data) make client validation/preview slow] → validate on debounce, render preview rows only (not test data), cap error list.
- [Client bundle grows by pulling tag taxonomy + Zod] → Zod is already client-side in forms; taxonomy is a small constant.
- [Server action payload size limit in Next.js (default 1 MB body)] → document in the dialog if hit; out of scope to raise unless observed.

## Migration Plan

No data migration. Ship behind no flag; rollback = revert commit.

## Open Questions

- Should import still bypass draft/validation and publish directly? Kept as-is here (spec'd in `problem-lifecycle`); could be a follow-up option ("import as drafts").
