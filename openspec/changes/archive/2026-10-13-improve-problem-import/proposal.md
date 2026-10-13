## Why

The "Import JSON" button on the problems list opens a file picker with no hint of what the file should contain. The expected shape lives only in a Zod schema inside a server action, so users have to read source code (or guess from `problems.json`) to build a valid file. When a file is wrong, the toast shows only the first Zod issue with no field path or problem index (e.g. "Invalid format: Required"), and some mistakes are silently accepted — mismatched `inputs`/`outputs` lengths or an `exampleCount` larger than the number of test cases get stored and break the problem later.

## What Changes

- Replace the bare "Import JSON" button with an **import dialog** that documents the format: a field reference (name, type, required/optional, default, allowed values incl. the tag taxonomy) and a copyable example.
- Add a **"Download template"** action that saves a ready-to-edit example JSON file.
- Allow supplying JSON by **file upload or paste**.
- **Validate client-side before importing** and show a **preview**: one row per problem (title, difficulty, test-case count, tags) plus every validation error, each located by problem index/title and field path (e.g. `#3 "Factorial" → outputs: expected 5 items to match inputs, got 4`). The Import button stays disabled until the payload is valid.
- **Tighten validation** (shared by client and server): `inputs.length === outputs.length`, `exampleCount <= inputs.length`, unknown top-level keys reported instead of silently dropped.
- Accept the optional problem fields the schema already supports but import ignored: `timeLimitMs`, `memoryLimitMb`, `narrative`.
- Accept either a bare array or `{ "problems": [...] }` as the root.
- Server action re-validates with the same schema and returns structured errors (all issues, with paths) instead of throwing a single message.
- Behaviour kept as-is: imported problems are created `published` with a generated slug and code (per `problem-lifecycle`), tags validated against the taxonomy (per `problem-tags`), insert is all-or-nothing.

## Capabilities

### New Capabilities
- `problem-import`: JSON bulk import of problems — accepted format and its in-app documentation/template, file-or-paste input, preview with located validation errors, validation rules, and all-or-nothing creation.

### Modified Capabilities
<!-- None: existing import requirements in problem-lifecycle (published status, code assignment) and problem-tags (tags accepted/validated) are unchanged and remain satisfied. -->

## Impact

- `web/lib/actions/problems/import-problems.ts` — uses shared schema, returns structured result.
- New shared module (e.g. `web/lib/problem-import/schema.ts`) importable from both client and server (no `"use server"`).
- `web/app/[locale]/problems/_components/import.tsx` — becomes a dialog (format docs, template download, upload/paste, preview).
- `web/messages/en.json`, `web/messages/br.json` — new `ImportProblems` strings.
- No DB schema change, no judge change, no new dependencies (Zod, shadcn Dialog/Tabs/Textarea already present).
