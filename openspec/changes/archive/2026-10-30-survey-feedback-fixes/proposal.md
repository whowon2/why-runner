## Why

The 2026-10-29 classroom test (30 first-year Técnico em Informática students, Python, SUS 72.1) surfaced small but concrete editor and feedback problems: the AI explanation cannot be scrolled, a locale switch wipes the student's code, auto-closing brackets annoy beginners, the verdict sits far from the editor, pasting from another editor may break code, and many wrong answers were caused by `input("Digite…")` prompts printed to stdout (31 of problem G's failures). Evidence and triage are in `docs/evaluation/survey-review.md` (items F2–F5, F7, F8). They are cheap to fix and should land before the thesis defense so the post-evaluation section can cite them.

## What Changes

- **F2 AI help readable at any length**: the AI help dialog keeps its title and buttons in view and scrolls its body (`max-h` + `overflow-y-auto`). Every dialog also gets a viewport height cap as a safety net, which fixes the problem Results-tab details dialog too. The AI help appears only in the exercise and contest submission lists (the problem workspace has none). On wide screens the dialog can also be **docked as a side panel next to the editor**, so the student reads the hint while editing; narrow screens keep the dialog only.
- **F3 Editor drafts survive navigation**: problem, exercise and contest editors save the code to `localStorage` per (user, target, language), plus the last language used per (user, target). On mount (e.g. after a locale switch remounts the page) they restore language and code. The draft is cleared when the target is accepted (`PASSED`) and when the student resets to starter code. Empty code and the untouched starter are never saved. A language switch on untouched code loads that language's saved draft, if any, before falling back to the starter. Edited code still stays put, as `nextCodeOnLanguageChange` does today. The contest panel's existing `code-<problem>-<language>` slots move to the same per-user keys, reading the old keys once as a fallback.
- **F4 Auto-close toggle**: a toggle next to the font-size control turns Monaco's `autoClosingBrackets` / `autoClosingQuotes` on or off. It is persisted in `localStorage` for all editors like the font size and defaults to on.
- **F5 Latest verdict in the toolbar**: next to the submit button, every editor (exercise code/blocks/parsons, problem Submit tab, contest panel) shows the newest submission's `StatusBadge` and pass count (`3/5`). Clicking it opens a dialog with the full `SubmissionDetails`. Exercise and contest lists poll every 2 s while a submission is pending, as the problem list already does, so the chip updates quickly.
- **F7 Pasted-code normalization (conditional)**: first reproduce in the browser. Python already confirms NBSP / U+200B / BOM → `SyntaxError`, mixed tabs → `TabError`, smart quotes → `SyntaxError`, CRLF → fine. If a paste path that breaks code is confirmed in Monaco or in production data, the submit actions normalize code server-side: NBSP-like spaces → space, zero-width characters and BOM removed, CRLF/CR/U+2028/U+2029 → LF, and for Python leading tabs → 4 spaces. Smart quotes are not rewritten, because they can be legitimate inside strings. If nothing reproduces, this item is dropped and the reason recorded.
- **F8 Extra-output hint**: when a visible test fails with wrong answer and the actual output contains the expected lines plus extra text with letters, the failure view shows a localized hint (pt-BR + en): "Your program printed extra text, e.g. a prompt in `input()`. Print only what the output asks for." Detection is a pure function in `lib/` with `bun test` coverage.
- The problem Results-tab details dialog renders the shared `SubmissionDetails` for failures. Today it shows input and expected output under the same label and never shows the student's own output, so this change also brings that view the actual output and the F8 hint.
- `web/package.json` version 1.0.0 → 1.1.0.
- No DB migration, no judge change.

## Capabilities

### New Capabilities
- `editor-drafts`: per-user, per-target, per-language editor draft persistence, restore and clearing.
- `editor-latest-verdict`: latest-submission verdict chip in every editor toolbar, opening the full details.
- `output-extra-text-hint`: detection of extra printed text (prompts) in failing visible tests and the hint shown for it.
- `submission-code-normalization`: server-side normalization of invisible and odd whitespace in submitted code (conditional on F7 reproducing).

### Modified Capabilities
- `code-editor-controls`: adds the persisted auto-close toggle.
- `editor-starter-code`: a language switch on untouched code prefers the saved draft, and reset clears the saved draft in every editor (not only contests). Contest slots become per-user drafts.
- `contest-ai-assistance`: the AI help dialog body scrolls with header/footer kept visible.
- `problem-workspace`: the Results details view shows the shared failing-test report (input, your output, expected, stderr, hint).

## Impact

- Code: `web/components/code-editor.tsx`, `web/components/ui/dialog.tsx`, `web/app/[locale]/contests/_components/ai-dialog.tsx`, `.../contests/_components/tabs/problem/upload.tsx`, `.../problems/_components/workspace/{index,submit,results}.tsx`, `.../classes/_components/exercise-detail.tsx`, `web/components/submissions/submission-details.tsx`, `web/components/reset-code-button.tsx`, `web/lib/starter-code.ts`. New: `web/lib/code-draft.ts`, `web/lib/output-hint.ts`, `web/lib/normalize-code.ts` (conditional), their tests, `web/hooks/use-code-draft.ts`, `web/hooks/use-editor-auto-close.ts`, `web/components/submissions/latest-verdict.tsx`.
- Hooks: `use-exercise-submissions` and `use-problem-submissions` refetch intervals become pending-aware. No new mutations. The existing submit hooks already invalidate the lists the chip reads, and this is rechecked against the mutation-cache-invalidation skill.
- Server actions (only if F7 confirmed): `create-submission`, `create-problem-submission`, `create-exercise-submission` normalize `code` in their zod schemas.
- i18n: new keys in `web/messages/{pt,en}.json` (`CodeEditor`, `Submissions` hint, verdict chip).
- Shared machines (school labs): drafts are keyed by user id, so the next student logging in on the same browser does not get them.
- Docs afterwards: `docs/evaluation/post-evaluation-changes.md`, slides and thesis post-evaluation section.
