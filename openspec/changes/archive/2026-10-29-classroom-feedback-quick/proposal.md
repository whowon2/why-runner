## Why

The first real classroom test of WhyRunner (2026-10-29) surfaced seven problems that each cost students or the teacher time in class: Brazilian students landed on the English UI, AI help stalled on failing Gemini calls, survey scales were hard to read, Google Translate crashed the code editor, lesson settings took seconds to save, the editor lacked basic ergonomics, and adding exercises to a lesson only offered a short, unsearchable list. All seven are small and contained (no DB migration), so they ship together before the next class session.

## What Changes

- **Locale**: Portuguese (`br`) becomes the default locale. Browsers whose `Accept-Language` asks for any `pt*` tag resolve to `br`, even when English is also listed at lower priority. An explicit language choice (the `NEXT_LOCALE` cookie or a `/en` URL) still wins.
- **AI chain order**: Claude Haiku (when `ANTHROPIC_API_KEY` is set) is tried first, then the Gemini models as fallbacks. The `lib/ai-models.ts` constants are renamed to match their new roles (`CLAUDE_MODEL`, `GEMINI_FALLBACK_MODEL`, `GEMINI_LITE_FALLBACK_MODEL`).
- **Survey Likert labels**: every point 1–5 shows its label ("Discordo totalmente" … "Concordo totalmente"), in `en` and `br`, not just the two ends.
- **Translation-safe code**: Monaco editors, code/test-case I/O blocks, the language selector (trigger and its portalled dropdown), Parsons lines and other code-rendering surfaces are marked `translate="no"` + `notranslate`, so Google Translate no longer rewraps text nodes React owns (`removeChild`/`insertBefore` crash) and no longer "translates" code.
- **Lesson settings are instant**: lesson update / publish / delete mutations apply an optimistic cache update to `["lessons", lessonId]` and invalidate only the queries that show lesson data (`["lessons", lessonId]`, `["classes", classroomId]` prefix), instead of the whole `["classes"]` and `["exercises"]` trees. Exercise pages are marked stale without an immediate refetch.
- **Editor controls**: one shared `CodeEditor` wrapper around Monaco adds a fullscreen toggle (Esc exits) and a font-size control persisted in `localStorage`, used by every code editor (lesson exercise, problem workspace, contest problem).
- **Lesson exercise picker**: "Add exercise" becomes the same searchable combobox the contest settings use (server-side search by title/code, showing code, title, author and difficulty), extracted into a shared `ProblemPicker`. It lists every problem the teacher can see (published + own drafts) instead of only their first 50 own problems.
- **Hardening**: `createExerciseEntry` rejects a problem the teacher cannot see (someone else's draft), matching what the picker offers.

## Capabilities

### New Capabilities
- `code-editor-controls`: shared Monaco wrapper with fullscreen toggle and persisted font size, used by every code editor.
- `translation-safe-rendering`: code, I/O and language-selection surfaces opt out of browser page translation.
- `lesson-exercise-picker`: searchable problem picker for adding exercises to a lesson, shared with the contest problem picker.

### Modified Capabilities
- `language-switching`: Portuguese is the default locale and `pt*` browsers are detected as Portuguese.
- `ai-provider-fallback`: chain order becomes Claude Haiku → Gemini → Gemini lite.
- `evaluation-surveys`: every Likert point is labelled.
- `query-cache-invalidation`: lesson mutations update optimistically and invalidate class-scoped keys instead of every class and exercise query.

## Impact

- `web/i18n/routing.ts`, `web/proxy.ts` (Accept-Language normalization).
- `web/lib/ai.ts`, `web/lib/ai-models.ts`, `web/CLAUDE.md` (AI Help section), `web/env.ts` comment if any.
- `web/app/[locale]/surveys/_components/likert-field.tsx`.
- New `web/components/code-editor.tsx`, `web/components/problem-picker.tsx`; edits to `exercise-detail.tsx`, `problems/_components/workspace/submit.tsx`, `contests/_components/tabs/problem/upload.tsx`, `contests/_components/tabs/settings/problems.tsx`, `classes/_components/manage-lesson.tsx`, and the code/I/O renderers listed in design.md.
- `web/hooks/use-update-lesson.tsx`; `web/lib/actions/lessons/create-exercise.ts` (visibility check).
- `web/messages/en.json`, `web/messages/br.json` (editor control labels, picker strings).
- No DB migration, no judge change, no new dependency.
