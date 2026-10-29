## 1. Default locale pt-BR

- [x] 1.1 Add `web/i18n/accept-language.ts` with `normalizeAcceptLanguage(header)` mapping every `pt`/`pt-*` range (any case, keeping `q`) to `br`, plus `web/i18n/accept-language.test.ts` (pt-BR+en list → br first; `en-US` unchanged; `es` unchanged; empty header; `PT-pt;q=0.5`)
- [x] 1.2 In `web/proxy.ts`, rewrite the `accept-language` request header with the helper before `intlMiddleware(request)`
- [x] 1.3 Set `defaultLocale: "br"` in `web/i18n/routing.ts`
- [x] 1.4 Verify with `curl -sI -H 'Accept-Language: pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7' localhost:$DEV_PORT/` → `/br`, `en-US` → `/en`, `es` → `/br`, `Cookie: NEXT_LOCALE=en` + pt-BR → `/en`

## 2. AI chain: Claude Haiku first

- [x] 2.1 Rename constants in `web/lib/ai-models.ts` to `CLAUDE_MODEL`, `GEMINI_FALLBACK_MODEL` (flash), `GEMINI_LITE_FALLBACK_MODEL` (flash-lite) and rewrite the order comment
- [x] 2.2 Reorder `chain()` in `web/lib/ai.ts` (Claude when `ANTHROPIC_API_KEY` is set, then both Gemini models) and update the file header comment; grep for any other importer of the old names
- [x] 2.3 Update `web/CLAUDE.md` (AI Help section + env var comment) and the `ANTHROPIC_API_KEY` description in `web/env.ts` / `.env.example` if present
- [x] 2.4 Smoke-test one AI help request and one `generateJson` feature (problem review) locally; check the log shows `claude/claude-haiku-5-5` succeeding first

## 3. Survey Likert labels

- [x] 3.1 Rework `web/app/[locale]/surveys/_components/likert-field.tsx` into a grid of columns (number box + label under it) for 1–5 and N/A; remove the "1 = / 5 =" legend; keep `title`/`aria-label`
- [x] 3.2 Confirm `Surveys…scale.1`–`scale.5`/`na` parity in `messages/en.json` and `messages/br.json`
- [ ] 3.3 Check `/surveys/preview/[form]` at 360px and desktop widths in both locales (no horizontal scroll)

## 4. Shared CodeEditor (fullscreen + font size)

- [x] 4.1 Add a `useEditorFontSize()` hook (localStorage `whyrunner:editor-font-size`, clamp 10–32, default 14, try/catch, read after mount, `storage` event sync)
- [x] 4.2 Add `web/components/code-editor.tsx`: Monaco wrapper with `toolbar` slot, theme mapping, `automaticLayout`, font-size `A−`/size/`A+` controls, fullscreen toggle (CSS fixed overlay, Esc exits unless `defaultPrevented`, body scroll lock), root `translate="no"` + `notranslate`
- [x] 4.3 Add `CodeEditor` messages (fullscreen, exitFullscreen, fontSmaller, fontLarger, fontSize) to `en.json` and `br.json`
- [x] 4.4 Migrate `classes/_components/exercise-detail.tsx` code editor to `CodeEditor`
- [x] 4.5 Migrate `problems/_components/workspace/submit.tsx` to `CodeEditor`
- [x] 4.6 Migrate `contests/_components/tabs/problem/upload.tsx` to `CodeEditor`, keeping `onMount` blur-save and the saved-at line
- [ ] 4.7 Browser check on all three: fullscreen enter/edit/Esc keeps code + undo; language Select and tooltips open in fullscreen; submit works in fullscreen; font size persists across editors and reload

## 5. Translation-safe rendering

- [x] 5.1 Add `translate="no"` + `notranslate` to every language selector's `SelectContent` (exercise-detail, workspace submit, contest upload)
- [x] 5.2 Mark I/O and code blocks: `problems/_components/examples.tsx`, `workspace/tests.tsx`, `workspace/results.tsx`, `workspace/validation.tsx`, `workspace/problem-review-panel.tsx`, `classes/_components/exercise-detail.tsx` (test cases + submissions), `classes/_components/lesson-review.tsx`, `contests/_components/tabs/problem/submission-list.tsx`, `problems/_components/create.tsx`, `problems/_components/import.tsx`
- [x] 5.3 Mark shared components: `components/blocks/portugol-code-panel.tsx`, `components/similarity/side-by-side.tsx`, `components/submissions/hidden-test-notice.tsx`, `components/submissions/visual-answer.tsx`, `components/parsons/parsons-editor.tsx`
- [x] 5.4 Add `pre`/`code` overrides with the opt-out in the markdown renderers (`problems/_components/description.tsx`, `contests/_components/ai-dialog.tsx`, exercise description in `exercise-detail.tsx`)
- [x] 5.5 Sweep: `grep -rn "<pre\|<code\|<Editor\|SelectContent\|ReactMarkdown" web/app web/components` and cover any remaining code surface
- [ ] 5.6 Manual test in Chrome with Google Translate on (translate to Portuguese on `/en`): lesson exercise language switch + reset, problem workspace, contest problem, Parsons drag; no console `removeChild`/`insertBefore` errors

## 6. Lesson mutations: optimistic + scoped invalidation

- [x] 6.1 `useUpdateLesson`: `onMutate` (cancel, snapshot, `setQueryData(["lessons", id])` merge, return `{ previous, classroomId }`), `onError` rollback, `onSettled` invalidate `["lessons", id]`, `["classes", classroomId]` (fallback `["classes"]`), `["exercises"]` with `refetchType: "none"`
- [x] 6.2 Same for `useSetLessonPublished`; `useDeleteLesson` invalidates `["classes", classroomId]` read from the cache in `onMutate`
- [x] 6.3 `ManageLesson` due date: send only complete dates or an explicit clear (no `""` mid-typing); keep the `onError` toasts
- [x] 6.4 Grep every `useQuery` reading lesson fields (`useLesson`, `useClass`, `useLessons`, gradebook, `useExercise`, `useHomeData`) and confirm coverage per the mutation-cache-invalidation skill
- [x] 6.5 Network check on a lesson page: toggling the switch flips immediately and fires only the update action plus the lesson / class-scoped refetches (count them; before = ~9)

## 7. Shared problem picker

- [x] 7.1 Extract `web/components/problem-picker.tsx` from the contest picker (debounced server search, `pageSize: 20`, `excludeIds`, `onSelect`, `disabled`, `placeholder`), adding `DifficultyBadge` to each item (move the badge to `components/` if needed)
- [x] 7.2 Use it in `contests/_components/tabs/settings/problems.tsx`; contest copy and behaviour unchanged apart from the difficulty
- [x] 7.3 Replace `AddExerciseForm`'s `Select` with `ProblemPicker` (`excludeIds={existingProblemIds}`, add on select, pending state, toasts); drop `my: true` / `pageSize: 50`; remove now-unused messages if any
- [x] 7.4 `lib/actions/lessons/create-exercise.ts`: reject problems that are neither published nor owned by the current user ("Problem not found")
- [ ] 7.5 Browser check: search by code and title, another author's published problem can be added, already-added problems hidden, contest picker still works

## 8. Wrap-up

- [x] 8.1 `bun lint`, `bun test lib i18n`, `bun run build` in `web/`
- [x] 8.2 Update `query-cache-invalidation` and other main specs at archive time (`/opsx:archive`)
- [x] 8.3 Write the "classroom feedback → fixes" list (one line per fix: problem seen in class → change) for the slides and `overleaf/`, and hand it to the user (do not edit the thesis/deck in this change unless asked)
