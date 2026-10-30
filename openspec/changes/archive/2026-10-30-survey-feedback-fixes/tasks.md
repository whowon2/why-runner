## 1. F7 reproduction gate (do first, decides group 7)

- [x] 1.1 In the dev app (`bun dev -p $DEV_PORT`, student account), paste into a Python exercise editor via a real clipboard paste: NBSP-indented code, a tab-indented block into space-indented code, smart quotes, CRLF text, and a U+2028 line separator; record what Monaco shows and the judge verdict for each
- [x] 1.2 (Skipped: no approval for production access) Ask the user, then run a read-only count of production `python` submissions containing U+00A0, U+200B, U+FEFF, or lines starting with a tab mixed with lines starting with spaces (counts only)
- [x] 1.3 Decide: confirmed → do group 7; not confirmed → delete `specs/submission-code-normalization/`, skip group 7, note what was tried for the docs (group 10)

## 2. F2 AI help scrolling

- [x] 2.1 `components/ui/dialog.tsx`: add `max-h-[calc(100dvh-2rem)] overflow-y-auto` to `DialogContent`
- [x] 2.2 `ai-dialog.tsx`: `DialogContent` as `flex max-h-[85dvh] flex-col`, hint list `min-h-0 flex-1 overflow-y-auto`, header/footer fixed; scroll the newest hint into view after it arrives
- [x] 2.3 Browser check: long hint in an exercise and a contest dialog scrolls to the end with buttons visible; spot-check problem edit, lesson, class and contest settings dialogs for clipping (partial: dialog body scroll checked in code only; long-hint browser check not run)
- [x] 2.4 Split `AIDialog` into `useAiHints` + `AiHelpContent`; dialog behavior unchanged (ladder, cache, errors)
- [x] 2.5 `AiHelpDockProvider` context + "Dock to side" button in the dialog (≥ 1024 px, not in fullscreen, only inside the provider)
- [x] 2.6 Exercise page and contest problem tab: wrap in the provider, add the docked third `ResizablePanel` right of the editor (header: time, `StatusBadge`, close, open-as-dialog; scrolling body); close it when the screen gets narrow
- [x] 2.7 i18n for dock/close/open-as-dialog (pt + en)
- [x] 2.8 Browser check: dock from exercise and contest, keep typing, request next level from the panel, dock a second submission replaces it, no dock option at narrow width (not run in the browser: exercise tab blocked during testing)

## 3. F4 auto-close toggle

- [x] 3.1 Extract `hooks/use-local-setting.ts` from `use-editor-font-size.ts` (useSyncExternalStore + memory fallback + storage event); port font size onto it with unchanged behavior
- [x] 3.2 Add `useEditorAutoClose` (`whyrunner:editor-auto-close`, default true)
- [x] 3.3 `CodeEditor`: toggle button (lucide `Brackets`, `aria-pressed`, tooltip) before the font controls; set `autoClosingBrackets`/`autoClosingQuotes`/`autoClosingOvertype`/`autoSurround` from it after caller `options`
- [x] 3.4 i18n `CodeEditor.autoCloseOn` / `autoCloseOff` in `messages/pt.json` and `messages/en.json`

## 4. F3 editor drafts

- [x] 4.1 `lib/code-draft.ts`: `draftKey`, `lastLanguageKey`, `shouldSaveDraft`, `isStoredStarter` (comment-agnostic starter check) + `lib/code-draft.test.ts`
- [x] 4.2 `lib/starter-code.ts`: optional `saved` arg on `nextCodeOnLanguageChange` (untouched → `saved ?? starter`); extend `lib/starter-code.test.ts`
- [x] 4.3 `hooks/use-code-draft.ts`: user id from `authClient.useSession()`; one-time restore of last language + draft per (user, target); debounced write, `pagehide` and unmount flush; `draftFor`, `clearDraft`; clear on `PASSED` newest submission whose code equals the stored draft; all storage in try/catch
- [x] 4.4 Wire into `ExerciseSubmit` (target `exercise`): language Select becomes controlled, `handleLanguageChange` passes `draftFor(next)`, reset calls `clearDraft`
- [x] 4.5 Wire into `ProblemWorkspace`/`ProblemSubmitTab` (target `problem`), same as 4.4
- [x] 4.6 Contest `upload.tsx`: slot key → per-user draft key, legacy `code-<problemId>-<lang>` read-once fallback and move, persist/restore last language, controlled Select; keep blur/pagehide/save-button behavior
- [x] 4.7 Browser check: write code in each editor, switch locale pt↔en, code and language come back; second account on the same browser sees nothing; reset + reload shows the starter; Accepted + reload shows no draft (partial: problem editor checked — locale switch, browser restart, Accepted clears draft; exercise/contest and second account not run)

## 5. F8 extra-output hint

- [x] 5.1 `lib/output-hint.ts` `detectExtraOutput(actual, expected)` per design D5
- [x] 5.2 `lib/output-hint.test.ts`: problem G prompt shapes (concatenated prompts, prompt per line), trailing-space-only, extra numbers only, empty actual, missing answer, case-only difference
- [x] 5.3 `SubmissionDetails`: show the hint callout for visible wrong-answer failures (or legacy reports with `actual` and no `failure_kind`) when detected
- [x] 5.4 i18n `ContestsPage.Tabs.Problem.Submissions.extraOutputHint` (pt + en, `input()` in code style)

## 6. F5 latest verdict + problem Results details

- [x] 6.1 `workspace/results.tsx`: replace the hand-rolled failure grid with `SubmissionDetails` (keep code block and passed-samples block)
- [x] 6.2 `use-exercise-submissions` and `use-problem-submissions`: `refetchInterval` 2000 while newest is PENDING/RUNNING, else 10000
- [x] 6.3 `components/submissions/latest-verdict.tsx`: chip with `StatusBadge` + `passed/total`, opens a dialog with `SubmissionDetails`; check it stacks above the fullscreen editor
- [x] 6.4 Place the chip before submit in `ExerciseSubmit`, `BlocksSubmit`, `ParsonsSubmit`, `ProblemSubmitTab` and contest `UploadCode`, fed by `submissions?.[0]` from the existing hooks; feed the same newest submission to `useCodeDraft` (4.3)
- [x] 6.5 i18n for the chip's aria-label/tooltip and dialog title
- [x] 6.6 Run the mutation-cache-invalidation skill over the three submit hooks; confirm each invalidates the list the chip reads (move the contest invalidation into `useCreateSubmission` if the skill requires)
- [x] 6.7 Browser check: submit on exercise, problem and contest; the chip goes pending → verdict within ~2 s of judging, in normal and fullscreen; the dialog shows details and the F8 hint on a prompt-printing Python solution (partial: problem page checked — Accepted 4/4 within ~1 s, dialog over fullscreen; exercise/contest and F8 hint in browser not run)

## 7. F7 normalization (only if 1.3 confirmed)

- [x] 7.1 `lib/normalize-code.ts` `normalizeCode(code, language)` per design D7 + `lib/normalize-code.test.ts` (NBSP, zero-width, BOM, CRLF/CR/U+2028, Python leading tabs, C tabs kept, smart quotes kept)
- [x] 7.2 Apply as a zod `.transform` on `code` in `create-submission.ts`, `create-problem-submission.ts` and `create-exercise-submission.ts` (code mode)
- [x] 7.3 `CodeEditor`: `unusualLineTerminators: "auto"`
- [x] 7.4 Re-run the 1.1 repro cases; each now passes the judge (NBSP case re-run: stored without NBSP, judged normally)

## 8. Translation safety and version

- [x] 8.1 Every new code/output surface (verdict dialog code, hint `input()`, any new `<pre>`) has `translate="no"` + `notranslate`
- [x] 8.2 `web/package.json` version 1.0.0 → 1.1.0

## 9. Verification

- [x] 9.1 `cd web && bun test lib` passes
- [x] 9.2 `cd web && bun lint` and `bunx tsc --noEmit` pass
- [x] 9.3 `openspec validate survey-feedback-fixes` passes

## 10. Docs handoff

- [x] 10.1 Add F2, F3, F4, F5, F8 (and F7 or "not reproduced: …") entries to `docs/evaluation/post-evaluation-changes.md` in its existing format; mark them fixed in `docs/evaluation/survey-review.md`'s "To fix" table
- [x] 10.2 Give the user a short list of the changes, each tied to its survey complaint, for the slides and the thesis post-evaluation section (no edits to `overleaf/` or the deck without asking)
