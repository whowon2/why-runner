## Context

Findings from code exploration (2026-10-30):

- **Editors.** Three callers render the shared `components/code-editor.tsx`:
  - `ExerciseSubmit` in `classes/_components/exercise-detail.tsx`: state is local, starts empty.
  - `ProblemSubmitTab`: state is lifted to `ProblemWorkspace` so it survives tab switches.
  - Contest `UploadCode`: already persists to `localStorage` under `code-<problemId>-<language>`, on blur, pagehide, the manual save button and slot switches. The key has no user id, and the selected language is not persisted.

  `CodeEditor` owns the font size, fullscreen and the toolbar layout. It does not own `code` or `language`.
- **Locale switch.** `components/language-switcher.tsx` does `router.replace(pathname, { locale })`. The `[locale]` segment changes, the page tree remounts, and every editor's local state is lost. Problem and exercise editors lose everything. The contest editor loses only the selected language, but the student must re-pick it, and that is not obvious.
- **Starter comments are locale-dependent.** `getStarterCode(lang, comments)` puts the comments in the UI locale, so the pt-BR starter differs from the en starter. A draft that is "the untouched starter" in one locale looks like user code in the other.
- **AI help.** `AIDialog` (`contests/_components/ai-dialog.tsx`) is used only in the contest `SubmissionList` and the exercise `ExerciseSubmissions`. The problem workspace has no AI help. `DialogContent` (`components/ui/dialog.tsx`) is a fixed, centered grid with no height cap. Every long dialog has the same overflow bug, and so does the problem Results "details" dialog.
- **Latest verdict data already exists client side:**
  - exercise: `useExerciseSubmissions`, polls every 10 s;
  - problem: `useProblemPracticeSubmissions`, polls every 2 s while pending;
  - contest: `useProblemSubmissions`, key `["submissions", problemId]`, polls every 10 s.

  All three return newest-first, already redacted. `passed_count`/`total_tests` survive redaction.
- **Problem Results details dialog** (`workspace/results.tsx`) has its own failure rendering. It shows input and expected output, both labelled `inputOutput`, and never the student's actual output. Exercise and contest lists use `SubmissionDetails`.
- **Paste (F7).** Monaco 0.55.1 via `@monaco-editor/react`. A local Python run shows that NBSP, U+200B and BOM in source give `SyntaxError: invalid non-printable character`, mixed tab/space indentation gives `TabError`, and smart quotes give `SyntaxError: invalid character '“'`. CRLF runs fine. Monaco's defaults: `unicodeHighlight` boxes NBSP and zero-width characters (visible but cryptic to a beginner); `unusualLineTerminators: "prompt"` raises a dialog on U+2028/2029; `formatOnPaste` is off; `insertSpaces` with `tabSize` 4 means typed indentation is spaces while pasted tabs stay tabs. This is not reproduced in the browser yet.
- **F8 data.** In production, 31 wrong-output failures on problem G printed prompts such as `Digite os valores da linha 1:` to stdout. `input(prompt)` writes the prompt without a newline, so the real output follows the last prompt on the same line.

## Goals / Non-Goals

**Goals:**
- Fix F2, F3, F4, F5 and F8. Handle F7 only once it is reproduced.
- One shared mechanism per concern, used by all three editors.
- Pure, `bun test`-covered logic for draft keys/rules, the extra-output detector and code normalization.
- No DB migration, no judge change, no new server action, no new mutation.

**Non-Goals:**
- F1 (compare-mode data switch) and F6 (run with custom input) from the review. They are tracked separately.
- Syncing drafts across devices (server-side drafts).
- Rewriting smart quotes or otherwise "fixing" student code semantics.
- AI side panel inside the fullscreen editor or on narrow screens.

## Decisions

### D1. F2: scrolling body in the AI dialog, height cap on every dialog

- `AIDialog`: `DialogContent className="flex max-h-[85dvh] flex-col"`. The hint list wrapper gets `min-h-0 flex-1 overflow-y-auto`, so the header (title/description) and the footer (cancel/next) stay visible. After a new hint arrives, scroll the body to the new hint.
- `components/ui/dialog.tsx` base: add `max-h-[calc(100dvh-2rem)] overflow-y-auto`. This catches every other dialog, including the Results details dialog.
- *Alternative:* fix only `ai-dialog.tsx`. Rejected because the same bug exists in other long dialogs and the base fix is one class.
- *Risk:* a dialog that relied on overflowing (an unportaled popover inside it) gets clipped. Radix Select/Popover/Tooltip all portal, so the risk is low. Check the dialogs with forms during QA.
### D1b. F2: dockable AI side panel (approved, in scope)

- Split `AIDialog` into `useAiHints(submission, maxLevel)` (steps, cached hints, request-next, error; the existing localStorage cache stays the source, so dialog and panel always show the same hints without new AI calls) and `AiHelpContent` (hint list + request/next button). The dialog and the panel both render `AiHelpContent`.
- `AiHelpDockProvider` (React context) wraps the exercise page and the contest problem tab. It holds the docked `{ submission, maxLevel } | null`. The dialog gets a "Dock to side" button (only when the provider is present and the screen is ≥ 1024 px, via `useMediaQuery`) that closes the dialog and docks that submission.
- Layout: the existing horizontal `ResizablePanelGroup` gains a third panel to the right of the editor, rendered only while something is docked (default 25 %, min 20 %, `order` + `id` set so react-resizable-panels keeps sizes stable). Header shows the submission's time and `StatusBadge`, plus close and "open as dialog" buttons; the body scrolls on its own.
- Docking another submission replaces the panel's content; a new submission does not auto-dock. Docked state is page state only (not persisted).
- Narrow screens (contest vertical layout, exercise on mobile): no dock button; if the screen shrinks while docked, the panel closes.
- In fullscreen the editor covers the page, so the panel is not visible there; the dock button is hidden while fullscreen is on. (Rendering the panel inside the fullscreen layer is a possible later step.)
- *Alternative:* a Radix `Sheet` overlaying the right edge. Rejected: it covers the editor, which is the complaint.

### D2. F3: draft persistence as a hook used by each caller, not inside `CodeEditor`

The request said "in the shared CodeEditor wrapper". `CodeEditor` does not own `code` or `language`, though. Restoring after a remount must set the **parent's** language state, and the contest panel has its own slot logic. So:

- `lib/code-draft.ts` (pure, tested):
  - `draftKey(userId, target, language)` → `whyrunner:draft:<userId>:<kind>:<id>:<language>`
  - `lastLanguageKey(userId, target)` → `whyrunner:draft-lang:<userId>:<kind>:<id>`
  - `shouldSaveDraft(code, language, comments)`: false when the code is blank or equals the current-locale starter
  - `isStoredStarter(code, language)`: true when the code equals the starter in **any** locale. A comments-agnostic check: both starters are compared with comment lines removed. This avoids treating a pt-BR untouched starter as user code after switching to en.

  `target` is `{ kind: "exercise" | "problem" | "contest", id }`. The contest id is `<contestId>:<problemId>`.
- `hooks/use-code-draft.ts`:
  - `useCodeDraft({ target, code, setCode, language, setLanguage })`. It reads the user id from `authClient.useSession()` and does nothing until the id is known or when there is no user.
  - On mount (once per target and user) it restores the last language and that language's draft. With no draft it loads the starter, which keeps today's "pick language → starter" flow.
  - It writes on change (debounced 500 ms), on `pagehide` and on unmount. The unmount flush is what saves the code on a locale switch.
  - It returns `draftFor(language)` and `clearDraft(language)`.
  - It wraps all `localStorage` access in try/catch. When storage is blocked, the editor just doesn't persist.
- `nextCodeOnLanguageChange(code, prev, next, comments, saved?)` gains an optional `saved` (the next language's draft). Untouched code becomes `saved ?? starter`, and edited code stays as-is. The existing spec and tests keep passing, and new tests cover `saved`.
- **Clear on Accepted:** the hook takes the latest submission (from D4) and removes the draft for the submission's language when its status becomes `PASSED` and its code equals the stored draft. The editor keeps showing the code. A later edit saves a new draft. A pass on a different, older version doesn't wipe newer work.
- **Clear on reset:** `ResetCodeButton` callers call `clearDraft(language)` in `onReset`. Undo restores the code, and the next debounced write saves it again.
- **Contest panel:** keep its blur/pagehide/manual-save UX, but its slot key becomes `draftKey(user, {kind:"contest", id}, lang)`. `readSlot` falls back to the legacy `code-<problemId>-<lang>` key once and then moves it to the new key. It also writes and restores `lastLanguageKey`, so the language comes back after a remount. The Select becomes controlled (`value={language}`).
- *Alternative:* a `draft` prop on `CodeEditor` that takes `setLanguage`. That couples the editor to language state and still needs a special case for the contest panel. Rejected, but cheap to switch to if you prefer the prop shape.
- *Alternative:* sessionStorage. It survives remounts but not closing the tab. Students in class do close tabs, so rejected.

### D3. F4: generic persisted-setting store

- Extract the `useSyncExternalStore` + memory-fallback pattern from `hooks/use-editor-font-size.ts` into `hooks/use-local-setting.ts` (`createLocalSetting(key, parse, default)`). Font size and the new `useEditorAutoClose` (`whyrunner:editor-auto-close`, default `true`) both use it.
- `CodeEditor` passes `autoClosingBrackets` and `autoClosingQuotes` as `on ? "languageDefined" : "never"`. `autoClosingOvertype` and `autoSurround` follow the same switch, so turning it off really stops the editor inserting characters. The toggle is a ghost icon button (lucide `Brackets`) with `aria-pressed` and a tooltip, placed before the font controls.
- Caller `options` cannot override these settings, just as they cannot override `fontSize` today.

### D4. F5: `LatestVerdict` chip opening a details dialog

- `components/submissions/latest-verdict.tsx`:
  - `LatestVerdict({ submission })` shows nothing without a submission. Otherwise it is a button with `StatusBadge` and, once judged, `passed_count/total_tests` from `parseReport`.
  - Clicking it opens a `Dialog` with `SubmissionDetails` (+ code collapsed) and the F8 hint.
  - It sits in each caller's toolbar right before the submit button. The callers pass `submissions?.[0]` from the hooks they already use: exercise code, blocks and parsons; problem; contest.
- Dialog over a list item: a scroll-to/expand-accordion approach does not work in fullscreen (the list is behind the fullscreen layer), and it would need lifted accordion state in three places. The dialog portals above the fullscreen editor. It must be checked that it stacks above `fixed z-50`; Radix portals are appended later, so it should be on top. If not, the chip dialog gets `z-[60]`.
- The polling of `useExerciseSubmissions` and `useProblemSubmissions` becomes `refetchInterval: hasPending ? 2000 : 10000`, matching the problem hook's pattern. Without this the chip would say "pending" for up to 10 s after the judge finished.
- No new mutations. The existing submit hooks already invalidate `["submissions","exercise",id]` and `["problem-submissions",id]`. The contest panel invalidates `["submissions", problemId]` in its component. The apply step reviews these with the mutation-cache-invalidation skill. Moving the contest invalidation into `useCreateSubmission` is allowed as a drive-by if the skill requires it.

### D5. F8: `detectExtraOutput(actual, expected)` in `lib/output-hint.ts`

- **Normalize both outputs:** CRLF → LF, `trimEnd` each line, collapse internal whitespace runs to one space, drop blank lines.
- **Return true only when all of these hold:**
  - expected is non-empty;
  - the normalized outputs differ;
  - every expected line is found in order inside the actual text (`indexOf` from a cursor, matched within or across actual lines);
  - the text left after removing the matched spans contains at least one letter (`\p{L}`).
- The letter rule separates prompts (`Digite…:`) from a wrong answer that merely prints extra numbers. In that case the hint would be misleading, so it stays silent.
- `SubmissionDetails` shows the hint (a muted info callout above the I/O grid) only when `failure_kind === "wrong_answer"` (or a legacy report without `failure_kind` but with `actual`) and the test is not hidden. The F2/F5 dialogs reuse `SubmissionDetails`, so the hint appears everywhere a visible failure is shown.
- i18n key `ContestsPage.Tabs.Problem.Submissions.extraOutputHint`. pt: "Seu programa imprimiu texto a mais, por exemplo a mensagem de um `input()`. Imprima só o que a saída pede." en: "Your program printed extra text, e.g. a prompt in `input()`. Print only what the output asks for."
- Tests use problem G's real shape: prompts concatenated, then output on the last prompt's line; a prompt per line; the trailing-space-only difference (false); extra numbers only (false); empty actual (false); a case-only difference (false).

### D6. Problem Results details dialog uses `SubmissionDetails`

Replace the hand-rolled failure grid in `workspace/results.tsx` with `SubmissionDetails`. This also fixes the duplicate `inputOutput` label and adds "your output", stderr and the F8 hint. Keep the code block and the passed-samples block. This is the same redacted data and stays within the submission-feedback-visibility spec.

### D7. F7: reproduce first, normalize server-side if confirmed

1. **Reproduce.**
   - In the dev app (student account, Python exercise), paste through a real clipboard `paste` event into Monaco. Use text containing NBSP indentation, a tab-indented block into space-indented code, smart quotes, CRLF and U+2028.
   - Record what Monaco shows (unicode highlight boxes, the unusual-line-terminators prompt) and what the judge returns.
   - Also run a read-only count of production `python` submissions containing U+00A0, U+200B, U+FEFF, or leading `\t` mixed with leading spaces. Ask before touching production.
2. **If confirmed:**
   - `lib/normalize-code.ts` `normalizeCode(code, language)` (pure, tested):
     - U+00A0, U+2007, U+202F → space;
     - U+200B, U+200C, U+200D, U+2060, U+FEFF → removed;
     - `\r\n`, `\r`, U+2028, U+2029 → `\n`;
     - for `python` only, leading tabs → 4 spaces each.
     - Characters inside string literals are not special-cased. The removed ones are invisible and the replaced ones look identical, so a student never intended them.
   - Apply it in the zod schemas of the three submit actions (`code: z.string().min(1).transform(...)`). This covers paste, typed Option+Space NBSP and file upload alike.
   - Set Monaco `unusualLineTerminators: "auto"` so the confusing prompt never appears.
3. **If not confirmed:** remove `specs/submission-code-normalization/`, note "not reproduced" with what was tried in `post-evaluation-changes.md`, and skip the code.

### D8. Version

`web/package.json` 1.0.0 → 1.1.0: user-visible features, no contract change.

## Risks / Trade-offs

- **Shared lab computers keep drafts in `localStorage` after logout.** → The keys include the user id, so another account never sees them. The data stays on disk, which is acceptable for practice code. Logout does not clear the drafts.
- **Restore-on-mount overwrites what a parent set first** (e.g. the contest load-saved toast flow). → The restore runs only once per (user, target) and only when the editor is still empty or holds the untouched starter.
- **The F8 heuristic can misfire.** → It needs letters in the extra text and only shows on wrong answers in visible tests. The wording says "e.g.", and the unit tests use real production shapes.
- **The dialog base `max-h`/`overflow` change could clip some content.** → Do a QA pass over the problem edit, lesson, class and contest settings dialogs.
- **The F7 normalization changes what the judge runs** compared with what the student sees. → Only invisible or visually identical characters change, and tabs only for Python, where mixing breaks the program anyway.
- **Faster polling (2 s while pending) adds load.** → It applies only while a submission is pending, as the problem hook already does.

## Migration Plan

- No DB migration. Deploy is the normal web deploy.
- Contest drafts: the legacy `code-<problemId>-<lang>` keys are read once and moved to the new key. Nothing is lost.
- Rollback: revert the web deploy. Old builds ignore the new keys, and the legacy contest keys are already moved, so a rollback loses the contest drafts saved by the new build. That is acceptable.

## Open Questions

Resolved 2026-10-30: hook-per-caller (D2) approved; side panel (D1b) in scope.

1. F7: OK to run the read-only production query (count only, no code read out)?
