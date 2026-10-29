## Context

Seven independent fixes from the 2026-10-29 classroom test (see proposal.md). They touch different parts of `web/` only; the judge, the DB schema and the server-action contract stay as they are. What each area looks like today:

- **Locale**: `i18n/routing.ts` = `locales: ["en", "br"]`, `defaultLocale: "en"`, default locale detection on. `proxy.ts` sets a pathname header and hands off to `createMiddleware(routing)` (next-intl 4.6). next-intl matches `Accept-Language` against the locale *codes*, and `br` is not a Portuguese tag (it is Breton), so `pt-BR` never matches it. A typical Brazilian Chrome sends `pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7`, which matches `en`. Only `lib/prompt.ts` `clampLocale` branches on the locale code, and it already treats anything non-`en` as `br`.
- **AI chain**: `lib/ai.ts` `chain()` = gemini-3.5-flash → gemini-3.5-flash-lite → claude-haiku-5-5 (only if `ANTHROPIC_API_KEY`), 30s per attempt. A Gemini 503 or hang costs up to 60s before Claude runs.
- **Likert**: `likert-field.tsx` renders `1 … 5` as number boxes and labels only 1 and 5 underneath. All five `scale.*` messages already exist in both locales, and each option already has `title`/`aria-label`.
- **Translate crash**: Google Translate replaces text nodes with `<font>` wrappers. When React later updates or removes a node it rendered, the DOM no longer matches and React throws `NotFoundError: Failed to execute 'removeChild'/'insertBefore' on 'Node'`. The language `Select` (Radix: `SelectValue` text swaps on change, and the dropdown is portalled to `body`), the starter-code swap and `ResetCodeButton` all update text in the area the student was using.
- **Lesson settings**: `ManageLesson` reads `lesson` from `useLesson` (`["lessons", lessonId]`). `useUpdateLesson` has no `onMutate` and invalidates `["lessons", id]`, `["classes"]` and `["exercises"]`. Every active query under those prefixes refetches through a server action, and Next.js runs server actions from one client one at a time, so the switch waited on the whole queue (~9 × 500 ms in class). `useSetLessonPublished` / `useDeleteLesson` also invalidate all of `["classes"]`.
- **Editors**: three `@monaco-editor/react` `<Editor>`s (`classes/_components/exercise-detail.tsx`, `problems/_components/workspace/submit.tsx`, `contests/_components/tabs/problem/upload.tsx`), each with its own copy of the theme ternary and its own toolbar row (language `Select`, optional file open, `ResetCodeButton`, submit). The contest one also uses `onMount` for local-storage saving on blur.
- **Picker**: `AddExerciseForm` = Radix `Select` over `useProblems({ page: 1, pageSize: 50, my: true })`, titles only. The contest picker (`contests/_components/tabs/settings/problems.tsx`) is an inline Popover + cmdk `Command` with server search (250 ms debounce, `pageSize: 20`, `shouldFilter={false}`), showing `[code] title by author`. `getProblems` already returns `code`, `difficulty`, `creatorName` and limits results to published + own. `createExerciseEntry` (`lib/actions/lessons/create-exercise.ts`) only checks that the problem id exists.

## Goals / Non-Goals

**Goals:**
- Brazilian students land on Portuguese with no manual switch.
- AI help answers in seconds in the common case.
- Survey points are self-explanatory.
- Google Translate cannot crash any code-editing flow.
- Lesson setting changes look instant and trigger the fewest refetches.
- One editor component with fullscreen + persisted font size.
- One problem picker for lessons and contests.

**Non-Goals:**
- Replacing the "show expected outputs" switch (that is `feat/test-visibility`). This change only fixes how its mutation updates the cache.
- Renaming the `br` locale code or the `/br` URL prefix (would break links, cookies and `clampLocale`).
- Making the whole site translation-proof (e.g. patching `Node.prototype`), or turning page translation off site-wide.
- Paging or filtering beyond search in the picker (top 20 results, same as contests).
- DB migrations, judge changes, new npm dependencies.

## Decisions

### 1. Locale: default `br`, and map `pt*` to `br` in `proxy.ts` before next-intl sees it
Set `defaultLocale: "br"`. In `proxy.ts`, before calling `intlMiddleware`, rewrite the request's `accept-language` header, replacing every language range whose primary subtag is `pt` (case-insensitive, any region) with `br` and keeping its `q` value. next-intl then ranks `br` by the browser's own preference order, so `pt-BR,…,en;q=0.7` → `br`, `en-US` → `en`, and anything else → default `br`. Precedence is unchanged: URL prefix > `NEXT_LOCALE` cookie > header > default.
Put the mapping in a small pure helper (`i18n/accept-language.ts`, `normalizeAcceptLanguage(header: string): string`) with a `bun test` unit test, since `lib/` already has Bun tests for pure modules.
- *Alternative: rename the locale to `pt-BR` with `localePrefix.prefixes = { "pt-BR": "/br" }`.* That would be the "proper" BCP 47 fix, but it changes the locale value seen by every `useLocale()`, the messages file name, `clampLocale`, stored cookies and any persisted locale strings. Too broad for a quick fix.
- *Alternative: `localeDetection: false`.* Then `en` browsers would also get Portuguese and there would be no detection at all. Rejected.
- Students who already have `NEXT_LOCALE=en` from the class session keep English until they switch once. That is expected, since a stored choice wins (see Risks).

### 2. AI chain: Claude first, then Gemini, with renamed constants
`lib/ai-models.ts`: `CLAUDE_MODEL = "claude-haiku-5-5"`, `GEMINI_FALLBACK_MODEL = "gemini-3.5-flash"`, `GEMINI_LITE_FALLBACK_MODEL = "gemini-3.5-flash-lite"`, with the comment describing the new order. `chain()` pushes Claude first when `ANTHROPIC_API_KEY` is set, then both Gemini models. `isRetryable` already treats Anthropic 5xx/529/429/connection errors as retryable, so no logic change there. Update `web/CLAUDE.md` "AI Help" and the comment in `env.ts` / `.env` docs ("enables Claude as last AI fallback" → "primary AI provider"). Keep the 30 s per-attempt timeout.
- *Alternative: lower the Gemini timeout.* That treats the symptom only, and a long Gemini answer would still be slow.

### 3. Likert: label under every point
Render each option as a column: the number box on top and its short label (`scale.1`…`scale.5`, `scale.na`) directly under it in `text-xs text-muted-foreground`, centred, wrapping within the column. Lay the five columns out in a `grid grid-cols-5` (plus one for N/A) so they share the width on phones, and drop the separate "1 = … / 5 = …" legend. Keep the `title`/`aria-label`. No message changes are needed: all labels already exist in both locales (verify `en`/`br` parity during implementation).

### 4. Translation opt-out: `translate="no"` + `notranslate` on code surfaces only
Both are needed: `translate="no"` is the standard attribute, and Google Translate also honours the `notranslate` class. Apply them:
- On the shared `CodeEditor` wrapper root (covers Monaco's DOM and the toolbar row, including the `SelectTrigger`).
- On the `SelectContent` of every language selector. It is portalled to `body`, so it does not inherit the attribute from an ancestor.
- On the `pre`/`code` I/O and code blocks: `problems/_components/examples.tsx`, `workspace/tests.tsx`, `workspace/results.tsx`, `workspace/validation.tsx`, `workspace/problem-review-panel.tsx`, `classes/_components/exercise-detail.tsx` (test cases + submissions), `classes/_components/lesson-review.tsx`, `contests/_components/tabs/problem/submission-list.tsx`, `problems/_components/create.tsx` preview blocks, `problems/_components/import.tsx`, `components/blocks/portugol-code-panel.tsx`, `components/similarity/side-by-side.tsx`, `components/submissions/hidden-test-notice.tsx`, `components/submissions/visual-answer.tsx`, and `components/parsons/parsons-editor.tsx`. Parsons reorders its line nodes on drag, which is exactly React's `insertBefore` path, so it matters most there.
- In markdown renderers (`problems/_components/description.tsx`, `ai-dialog.tsx`, `exercise-detail.tsx` description), via component overrides for `pre` and `code`.
To avoid repeating both attributes everywhere, add a tiny `noTranslate` props constant (`{ translate: "no", className: "notranslate" }`) or a `cn("notranslate", …)` + `translate="no"` convention. Implementation picks whichever reads cleaner per call site. A final `grep -rn "<pre\|<code\|<Editor\|SelectContent"` sweep confirms that every code surface is covered.
- *Alternative: the well-known `Node.prototype.removeChild/insertBefore` monkey-patch (facebook/react#11538).* It hides the crash everywhere but silently leaves DOM out of sync and patches globals. Rejected. If the crash shows up again on a non-code surface, revisit this as an opt-in safety net.
- *Alternative: `<html translate="no">`.* This blocks students who rely on translation for English problem statements. Rejected.

### 5. Lesson mutations: optimistic `setQueryData`, class-scoped invalidation
In `hooks/use-update-lesson.tsx`:
- `useUpdateLesson` / `useSetLessonPublished`: `onMutate` → `cancelQueries(["lessons", id])`, snapshot the cached value, then `setQueryData(["lessons", id], old => ({ ...old, lesson: { ...old.lesson, ...changedFields } }))` and return `{ previous, classroomId: previous?.lesson.classroomId }`. `onError` → restore the snapshot. `onSettled` → invalidate `["lessons", id]` (one action), invalidate `["classes", classroomId]` (prefix: class-detail cards, lessons list, gradebook; only the active ones refetch), and `invalidateQueries({ queryKey: ["exercises"], refetchType: "none" })` (marks exercise pages stale without refetching now; they are not shown on this page). If `classroomId` is unknown (no cache), fall back to `["classes"]`.
- `useDeleteLesson`: same class-scoped invalidation. The lesson cache must be read in `onMutate` before deleting.
- `["home"]` already uses `staleTime: 0`, so it needs no invalidation.
- Due-date input: send only complete values. A native date input fires `onChange` with `""` while it is partially typed, which today clears the due date on the server mid-typing. Commit on `onBlur` (or on `onChange` when `e.target.value` is a full `YYYY-MM-DD` or the user explicitly cleared it). Optimistic update makes this cheap to get right.
- Callers keep `onError: toast.error`. Rollback lives in the hook.
- Update the `query-cache-invalidation` spec: the gradebook requirement becomes class-scoped for lesson mutations, plus a new optimistic requirement. Per the mutation-cache-invalidation skill, grep every `useQuery` that reads lesson fields (`useLesson`, `useClass`, `useLessons`, gradebook, `useExercise`, home) and confirm each one is covered.

### 6. Shared `CodeEditor` component
New `web/components/code-editor.tsx` (client component):
```tsx
<CodeEditor
  toolbar={<>…language Select, file, ResetCodeButton, submit…</>}
  height={500 | "100%" | "min(600px, 60vh)"}
  language={language ?? ""}
  value={code}
  onChange={…}
  onMount={…}     // passed through
/>
```
- It owns the theme mapping (`useTheme`, which removes three duplicated ternaries), `options={{ fontSize, automaticLayout: true }}`, the `translate="no" notranslate` root, and a right-aligned control cluster: `A−` / size readout / `A+` and a `Maximize2`/`Minimize2` fullscreen toggle (icon buttons with tooltips, labels under a new `CodeEditor` messages namespace).
- **Fullscreen**: a CSS overlay, not the browser Fullscreen API. While on, the wrapper root gets `fixed inset-0 z-50 bg-background p-4 flex flex-col` and the editor area `flex-1`. Because it is the same React subtree with only the class changed, Monaco is not remounted, so code, cursor and undo stay. Esc listener on `document` (ignored while a Radix popover/select is open, i.e. `event.defaultPrevented`), and `overflow: hidden` on `body` while active. The Fullscreen API was rejected: Radix portals render outside the fullscreen element, so the language dropdown would be invisible, and some browsers / iframes block it.
- **Font size**: a `useEditorFontSize()` hook backed by `localStorage["whyrunner:editor-font-size"]`, clamped to 10–32, default 14, step 1 or 2. Every read and write is wrapped in try/catch. It reads after mount to avoid a hydration mismatch, and a `storage` event listener syncs other open tabs.
- Migrate the three editors to it. The contest editor's `onMount` (blur-save) passes through unchanged.

### 7. Shared `ProblemPicker`
Extract the contest Popover + Command into `web/components/problem-picker.tsx`:
```tsx
<ProblemPicker
  excludeIds={string[]}
  onSelect={(problem) => void}
  disabled={boolean}
  placeholder={string}
/>
```
- Debounced search state and `useProblems({ page: 1, pageSize: 20, search })` live inside the picker. Each item shows `[code]`, title (truncated), `DifficultyBadge` (from `problems/_components/badge.tsx`, move it to `components/` if the import direction looks wrong) and "by {creatorName}". Strings move from `ContestsPage.Tabs.Settings.Problems` to a shared `ProblemPicker` namespace, or are passed in. Pick whichever keeps the existing contest copy unchanged.
- The contest settings use it, keeping `CreateProblemButton` beside it. `AddExerciseForm` uses it with `excludeIds={existingProblemIds}` and adds on select (no separate Add button; the toast/pending state stays as today).
- Dropping `my: true` widens the lesson picker to published + own drafts, which is what `getProblems` already returns.
- **Server**: `createExerciseEntry` loads `status` and `createdBy` and throws "Problem not found" unless `status === "published" || createdBy === currentUser.id`. Without this, the wider picker relies on a check the server does not make.

## Risks / Trade-offs

- [Students who already have an `en` cookie from the class session stay on English] → Expected, since a stored choice wins. Mention in the next class that the language switch is in the dock. Do not override the cookie.
- [Claude first raises paid API usage; Gemini has a free tier] → Haiku is cheap, AI calls are rate-limited per feature, and the classroom showed the latency cost was worse. With no `ANTHROPIC_API_KEY` the chain is Gemini-only, as before.
- [Claude and Gemini phrase answers differently; prompts were tuned on Gemini] → `generateJson` validates the schema for both. Spot-check AI help, problem review, narrative and tag suggestion once with Claude first.
- [Translate opt-out misses a surface] → The final grep sweep plus a manual run with Google Translate on (lesson exercise, problem workspace, contest, Parsons).
- [Fullscreen overlay at z-50 collides with Radix portals (also z-50)] → Portals mount after the overlay in `body`, so they stack above it. Verify the language Select and tooltips open inside fullscreen, and bump the overlay to `z-40` if not.
- [Optimistic update shows a value the server later rejects] → Rollback on error plus a toast. The refetch on settle reconciles any server-side normalization.
- [Wider picker lists many public problems] → Server search + top 20, same as contests.

## Migration Plan

No data migration. Deploy web only. Rollback = revert the commit. Locale and AI changes take effect on the next request, and the font size key is new (nothing to migrate).

## Open Questions

- None blocking. (The Likert layout under a 360px screen may need the N/A option on its own row; settle that visually during implementation.)
