## 1. Data model

- [x] 1.1 Add `ProblemTag` pg enum (24 keys in two groups, from spec) + `PROBLEM_TAG_GROUPS` and `tags problem_tag[] NOT NULL DEFAULT '{}'` column to `web/drizzle/schemas/problems.ts`; export `PROBLEM_TAGS` and `type ProblemTag`
- [x] 1.2 Run `bun db:generate`, review the generated SQL (create type + add column only), run `bun db:migrate` locally
- [x] 1.3 Add `ProblemTags` i18n namespace with labels for every key in `web/messages/en.json` and `web/messages/br.json`, plus new UI strings (picker, filter, AI suggest button/loading/errors)

## 2. Server actions

- [x] 2.1 `update-problem.ts` / `UpdateProblemInput`: accept `tags`, validate with `z.array(z.enum(PROBLEM_TAGS))`, dedupe before write
- [x] 2.2 `get-problems.ts`: add `tags?: ProblemTag[]` param, push array-contains (`@>`) condition into shared `conditions` (affects page + count), select `tags` in the row
- [x] 2.3 `import-problems.ts`: optional `tags` in import schema, default `[]`, store on insert
- [x] 2.4 Add tag-suggestion system instruction + prompt builder to `web/lib/prompt.ts` (solution-technique focus, 1–5 tags, list of allowed keys)
- [x] 2.5 New `lib/actions/problems/suggest-problem-tags.ts`: owner check on `problemId`, reject empty description before LLM call, cap input length, Gemini JSON call with enum `responseSchema`, filter/dedupe/cap result at 5

## 3. Shared UI

- [x] 3.1 Tag badge + `ProblemTags` list component (localized labels, optional max-visible with "+N") next to `DifficultyBadge` in `problems/_components/badge.tsx`
- [x] 3.2 `TagMultiSelect` component (Popover + Command, checkable items grouped under Fundamentals/Algorithms headings, `value`/`onChange`, trigger shows selected count)

## 4. Authoring form

- [x] 4.1 `hooks/use-suggest-problem-tags.tsx` mutation hook (no writes → no invalidation; note it per mutation-cache-invalidation skill)
- [x] 4.2 `create.tsx`: add `tags` to `formSchema`/defaults/`onSubmit`, render `TagMultiSelect` as a form field
- [x] 4.3 `create.tsx`: "Suggest tags with AI" button using current form title/description; on success replace field value with `shouldDirty: true`; on error toast and keep selection; disable while pending
- [x] 4.4 Show tags in the form's preview tab if it renders the header/badges

## 5. Problems list & view

- [x] 5.1 `hooks/use-problems.tsx`: accept `tags` param and include it in the query key
- [x] 5.2 `list.tsx`: parse `tags` URL param (comma-split, filter to `PROBLEM_TAGS`), add `TagMultiSelect` filter to `filters` slot writing comma-joined param (deleted when empty, page reset)
- [x] 5.3 `list.tsx`: add tags column rendering compact `ProblemTags`
- [x] 5.4 `header.tsx`: show `ProblemTags` beside difficulty badge when non-empty; ensure `getProblemBySlug` returns `tags`

## 6. Verification

- [x] 6.1 Typecheck + lint (`bun run lint`, `tsc --noEmit` or project equivalent) pass
- [ ] 6.2 Manual: tag a draft manually, save, reload → tags persist; non-owner update/suggest rejected
- [ ] 6.3 Manual: AI suggest on unsaved description fills picker, nothing persisted until save; empty description shows error without LLM call
- [ ] 6.4 Manual: list filter with 1 and 2 tags (AND), combined with difficulty, URL reload keeps selection, pagination count correct
- [ ] 6.5 Manual: import JSON with valid tags, without tags, and with invalid tag (rejected)
- [ ] 6.6 Both locales show translated tag labels
