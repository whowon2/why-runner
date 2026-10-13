## Context

`problem` (`web/drizzle/schemas/problems.ts`) has `difficulty` as its only classification. The problems list (`app/[locale]/problems/_components/list.tsx`) filters by search, difficulty and "my problems" through URL search params → `useProblems` → `getProblems` server action, which builds a Drizzle `where` and a matching count query. Problem authoring happens in the draft edit form (`_components/create.tsx`, `NewProblem`), which already hosts two Gemini-backed helpers: "Generate narrative" (`generate-problem-narrative.ts`, plain text) and "Review with AI" (`review-problem.ts`, structured JSON via `responseSchema`). AI calls use `@google/genai` with `GEMINI_MODEL` and prompts in `lib/prompt.ts`. There's no existing topic taxonomy anywhere in the schema (the old `lessonTheme` tables referenced in older notes are gone).

The judge never reads problem classification fields, so this is a web-only change.

## Goals / Non-Goals

**Goals:**
- One fixed tag taxonomy shared by DB, server validation, UI, i18n and the AI prompt.
- Authors tag problems manually or via one-click AI suggestion, saved through the normal form save.
- Problems list shows tags and filters by them (AND semantics), URL-synced.

**Non-Goals:**
- User-defined / free-form tags, or per-class custom taxonomies.
- Auto-tagging on save or batch re-tagging existing problems with AI.
- Tag filters in other problem pickers (contest settings, lesson manager, user profile "my problems") — they call `getProblems` and keep working unchanged; adding the filter there is a later follow-up.
- Tag-based recommendations or per-tag user skill stats.
- Making tags a publish requirement.

## Decisions

### 1. Fixed taxonomy as a Postgres enum array, not a tags table
`export const ProblemTag = pgEnum("problem_tag", [...])` in `problems.ts`, column `tags: ProblemTag().array().default(sql\`'{}'\`).notNull()`, plus `PROBLEM_TAGS = ProblemTag.enumValues` and `type ProblemTag` exported for the rest of the app.
- **Why:** taxonomy is small and curated; enum gives DB-level validation for free, a single source for zod (`z.enum(PROBLEM_TAGS)`), the Gemini `responseSchema` (`enum: PROBLEM_TAGS`), and i18n keys. Filtering is a single-column array op — no join, so `getProblems`' data and count queries stay simple.
- **Alternatives:** `tag` + `problem_tag` join tables — needed only for user-defined tags (non-goal); costs a join/aggregate in both list queries. Plain `text[]` — loses DB validation and lets AI/import garbage through on any missed check.
- **Groups:** enum order is fundamentals then algorithms; `PROBLEM_TAG_GROUPS` slices `PROBLEM_TAGS` at `math`, and the picker renders one headed `CommandGroup` per group. Dropped the catch-all `implementation` tag during development (it was what every intro problem got, which made it useless as a filter); since 0044 never shipped, the migration was rewritten rather than altered.
- **Cost:** adding a tag later = `ALTER TYPE ... ADD VALUE` migration (cheap, drizzle-kit generates it). Removing/renaming one is harder — acceptable for a curated list.

### 2. AND filter via `@>` (array contains)
`getProblems` gets `tags?: ProblemTag[]`; when non-empty, push ``sql`${problem.tags} @> ${tags}::problem_tag[]` `` (or Drizzle's `arrayContains(problem.tags, tags)`) into the shared `conditions`, so both the page query and the count query honour it. URL param: `tags=graphs,greedy` (comma-joined; keys are kebab-case so no escaping issues), parsed and filtered against `PROBLEM_TAGS` on the client so a hand-edited URL can't send invalid values; server also validates.
- **Why AND:** narrowing ("graphs + DP") is the common use when picking contest problems; matches Codeforces. OR would mostly re-broaden the list.
- GIN index on `tags` is not needed at current scale (hundreds of problems); revisit if the list grows.

### 3. AI suggestion takes current form text, not the saved row
New server action `suggestProblemTags({ problemId, title, description }): Promise<ProblemTag[]>`:
1. `getCurrentUser`, then verify the caller owns `problemId` (same ownership check as `review-problem.ts`) — keeps the "creator only" rule and stops the endpoint being a free Gemini proxy.
2. Reject empty description before calling Gemini.
3. Call Gemini with `responseMimeType: "application/json"` and `responseSchema` `{ tags: ARRAY of STRING with enum: PROBLEM_TAGS }`, system instruction asking for 1–5 most relevant tags covering the intended solution technique, not surface story.
4. Parse, filter to `PROBLEM_TAGS`, dedupe, cap at 5, return.
- **Why form text:** authors tag while writing; requiring a save first (as narrative does) is a pointless extra step and gives stale results. Inputs are length-capped (e.g. description ≤ 20k chars) to bound token cost.
- The form replaces (not merges) the picker selection with the result, so re-clicking after editing the description gives a clean answer; author can then adjust.

### 4. UI components
- `components/problem-tag-badge.tsx` / `ProblemTags` list in `_components/badge.tsx` next to `DifficultyBadge`, labels via `useTranslations("ProblemTags")`.
- Tag picker: Popover + Command multi-select (both already in `components/ui`), shared between the edit form (`FormField name="tags"`) and the list filter. One `TagMultiSelect` component with `value`/`onChange`.
- List: new column rendering up to ~3 badges + "+N" overflow to keep rows compact; filter added to the existing `filters` slot.
- Hook `hooks/use-suggest-problem-tags.tsx` (`useMutation`, no cache invalidation — it doesn't write anything). The tags field joins `formSchema`/`onSubmit` in `create.tsx`, and `UpdateProblemInput` allows `tags`; existing `["problems"]` invalidation on save already covers the list.

### 5. Server-side validation of tags on write
`updateProblem` currently spreads `input.problem` straight into `.set()`. Tags are parsed with `z.array(z.enum(PROBLEM_TAGS))` and deduped before write; DB enum is the backstop. Import schema gains `tags: z.array(z.enum(PROBLEM_TAGS)).optional().default([])`.

## Risks / Trade-offs

- [AI picks plausible-but-wrong tags, e.g. tags story ("graphs" for a map-themed sorting problem)] → prompt explicitly focuses on solution technique; result only pre-fills the form, author must save.
- [Fixed list misses a topic a professor needs] → list is broad CP coverage; extending is a one-line enum change + migration + two i18n entries.
- [Enum value removal is painful in Postgres] → treat keys as permanent; rename only the localized label.
- [Gemini cost/abuse] → owner-only, explicit click only, input length cap.
- [Filter UI crowding on mobile] → filter is a single compact popover trigger showing count ("Tags (2)").

## Migration Plan

1. Add enum + column in schema, `bun db:generate`, review SQL (`CREATE TYPE problem_tag`, `ALTER TABLE problem ADD COLUMN tags problem_tag[] DEFAULT '{}' NOT NULL`), `bun db:migrate`. Additive, existing rows get `{}`; no backfill.
2. Ship server + UI in the same deploy (column default means old code is unaffected if UI lags).
3. Rollback: revert code; column/type can stay harmlessly or be dropped by a follow-up migration.

## Open Questions

- Should the "Review with AI" panel also suggest tags in one combined call? Kept separate for now (simpler, independent buttons); can merge later.
