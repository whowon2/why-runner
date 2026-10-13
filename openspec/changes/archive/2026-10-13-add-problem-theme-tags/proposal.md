## Why

Problems today carry only a title, difficulty and creator, so a professor building a contest or lesson — or a student looking for practice on a specific topic — has no way to find "all graph problems" or "easy DP problems" short of opening each one. Theme tags (graphs, greedy, dynamic programming, …) are the standard way judges like Codeforces solve this, and tagging is tedious enough that authors will skip it unless the platform helps, which the existing Gemini integration can do cheaply.

## What Changes

- Add a fixed, curated taxonomy of problem theme tags in two groups — **Fundamentals** for intro-programming problems (`loops`, `conditionals`, `arrays`, …) and **Algorithms** for competitive-programming techniques (`greedy`, `graphs`, `dynamic-programming`, …) — with localized labels (en / pt-BR). WhyRunner's main audience is intro-programming classes, so most problems need the fundamentals group to be filterable at all.
- Store zero or more tags per problem as a new `tags` column on `problem` (array of a Postgres enum), defaulting to empty so existing problems stay valid.
- Problem edit/create form gets a tag picker so the author can set the problem's tags; tags save with the rest of the form.
- Problem edit/create form gets a "Suggest tags with AI" action: sends the problem's current title and description to Gemini, which picks tags from the fixed taxonomy only; the result pre-fills the picker and is not persisted until the author saves.
- Problems list shows each problem's tags in its row and adds a multi-select tags filter (problem must have **all** selected tags), synced to the URL like the existing filters.
- Problem view page shows the problem's tags next to the difficulty badge.
- JSON problem import accepts an optional `tags` array (validated against the taxonomy).

## Capabilities

### New Capabilities
- `problem-tags`: the theme tag taxonomy, per-problem tag storage, author tag editing, tag display on the problem page, AI tag suggestion, and tags in JSON import.

### Modified Capabilities
- `problem-list-view`: the table gains a tags column/indicator and a tags filter alongside search, difficulty and "my problems".

## Impact

- **DB**: new `problem_tag` pg enum + `problem.tags problem_tag[] NOT NULL DEFAULT '{}'` (Drizzle migration via `bun db:generate`). Judge is unaffected — it never reads problem metadata beyond I/O and limits, so no Rust enum sync needed.
- **Server actions** (`web/lib/actions/problems/`): `update-problem.ts` (accept tags), `get-problems.ts` (select tags, `tags` filter param), `import-problems.ts` (optional tags), new `suggest-problem-tags.ts` (Gemini, structured JSON output, same pattern as `review-problem.ts`).
- **Prompts**: new tag-suggestion system instruction/prompt in `web/lib/prompt.ts`.
- **UI**: `problems/_components/create.tsx` (picker + AI button), `problems/_components/list.tsx` (column + filter), problem header/badges, new `use-suggest-problem-tags` hook, `use-problems` params.
- **i18n**: tag labels and new strings in `web/messages/en.json` and `br.json`.
- **External**: additional Gemini calls (one per explicit click; no automatic calls).
