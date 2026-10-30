## Context

Three pages host a solution editor today, each with its own layout:

- **Practice** (`app/[locale]/problems/[slug]/page.tsx` → `problems/_components/workspace/index.tsx`): Radix tabs Task / Submit / Results / Statistics / Tests / Edit, URL `?tab=`. Code and language are lifted into the workspace so they survive tab switches. Verdicts only appear in the Results tab table (`results.tsx`, `useProblemPracticeSubmissions`, polls every 2s while pending).
- **Contest** (`contests/[slug]/page.tsx` → `ContestTabs` → `tabs/problem/index.tsx`): letter selector (`SelectProblem`, `?problem=<slug>`), resizable statement/editor split (`ResizablePanelGroup`, horizontal ≥1024px, vertical below), the submission list (`SubmissionList`, accordion, 10s polling, `AIDialog` gated by `contest.aiAssistance`) under the statement, editor in `UploadCode` with per-problem+language `localStorage` drafts (blur / pagehide / slot switch).
- **Lesson exercise** (`classes/.../exercises/[exerciseSlug]/page.tsx` → `ExerciseHeader` + `ExerciseDetail`): resizable split, editor is code / `BlockWorkspace` / `ParsonsEditor` by `exercise.mode`; test cases, constraints and submission accordion stacked under the statement.

Shared pieces worth keeping: `CodeEditor` (Monaco wrapper with font size + fullscreen), `ResetCodeButton` / `useStarterComments` / `nextCodeOnLanguageChange`, `SubmissionDetails` (redacted report rendering), `StatusBadge` / `statusTone` / `isFinalFailure`, `AIDialog`, `ProblemDescription`, `useMediaQuery`, `components/ui/resizable`, `useProblemTests`, `useExercise` (already returns only visible `tests` + `hiddenTestCount`).

The root layout `app/[locale]/layout.tsx` renders `UserDock` (sticky bottom dock) and the async server `Footer` around every page. There is no site header.

The judge grades whole submissions (stop at first failure, except lesson exercises which `run_all`). Since PR #89 it also executes ungraded custom runs (`code_run`, channel `new_run`) that never read tests; the current editors show a `RunButton` + `RunPanel` (stdin box + result) under the editor.

## Goals / Non-Goals

**Goals:**
- One shell component tree for all three contexts; context differences live in small adapters.
- Verdict visible next to the editor right after Submit, everywhere.
- Play visible examples (reusing custom runs) with a match indicator, without spending a submission.
- No regression in access rules, hidden-test redaction, contest scoring, drafts, blocks/parsons modes.
- Usable on phones.

**Non-Goals:**
- Server-side example verdicts (checker problems) — would need runs to read tests, which the custom-run spec forbids.
- Changing grading semantics of submissions (stop-at-first-failure stays).
- Redesigning the contest page itself (leaderboard/settings/manage tabs) or the lesson roadmap.
- Problem creation/edit form changes beyond moving it to its own route.

## Decisions

### 1. Hide site chrome by path, not by route groups
Wrap `UserDock` and `Footer` in a small client `SiteChrome` component that renders its children unless `isWorkspacePath(pathname)` (from `lib/workspace-routes.ts`) matches `/problems/[slug]` (not `/problems/new`, not `/edit`), `/contests/[slug]/problems/[problemSlug]`, or `/classes/[c]/lessons/[l]/exercises/[e]` (not `/similarity`). The server `Footer` is passed as `children`, so it stays a server component.
*Alternative*: split `app/[locale]` into `(site)` and `(workspace)` route groups with separate layouts — cleaner in principle but moves every page directory and churns every import path; rejected for this change. The matcher has unit tests (`bun test lib`).

### 2. Presentational shell + context adapters
`components/workspace/`:
- `workspace-shell.tsx` — layout only: `TopBar`, `Rail`, statement column (scroll area + `ConsolePanel` at bottom), editor side (editor slot + `TestCasesPanel` + `ActionsPanel`). Uses `ResizablePanelGroup` horizontally (statement | editor side) and vertically (editor | bottom panels) on wide screens. Takes slots/props, owns maximize and narrow-view state.
- `workspace-context.tsx` — React context with a `WorkspaceSource` the adapters provide:
  ```ts
  type WorkspaceSource = {
    kind: "practice" | "contest" | "exercise";
    draftKey: string;                     // problem id or exercise id
    tests: VisibleTest[]; hiddenCount: number;
    canSubmit: boolean; lockedReason?: string;
    submit(answer: WorkspaceAnswer): Promise<void>;
    runsEnabled: boolean;                 // useRunsEnabled() && contest.allowRuns, false for parsons
    toRunProgram(answer: WorkspaceAnswer): RunProgram | null; // createRun input minus stdin
    compare: { mode: CompareMode; epsilon: number };
    submissions: { data, isPending };     // context-scoped history, polled
    aiMaxLevel: AiLevel | null | "off";
  };
  type WorkspaceAnswer =
    | { mode: "code"; language: Language; code: string }
    | { mode: "blocks"; workspace: SerializedWorkspace }
    | { mode: "parsons"; lines: ParsonsLine[] };
  ```
- Adapters: `problems/_components/workspace/index.tsx` (rewritten: `ProblemWorkspace`), `contests/[slug]/problems/[problemSlug]/_components/contest-problem-workspace.tsx`, `classes/_components/exercise-workspace.tsx` (replaces `ExerciseDetail` + `ExerciseHeader`). Each wires the existing mutation/query hooks into `WorkspaceSource` and supplies rail items and top-bar status.
*Alternative*: one big component with `if (contest)` branches — rejected, today's three layouts drifted exactly because there was no shared seam.

### 3. Latest verdict = head of the context's history query
The inline verdict reads the newest entry of the context's submission history (practice `useProblemPracticeSubmissions`, contest `useProblemSubmissions`, exercise `useExerciseSubmissions`). All three hooks get the same polling rule as practice (2s while any row is `PENDING`/`RUNNING`, off otherwise; contest/exercise currently poll every 10s unconditionally) — shared as `pendingRefetchInterval` in `lib/submission-status.ts`. Submit mutations already invalidate these keys. No server action needs to return the new id.
*Alternative*: return the id from `createSubmission` and poll a single-row query — more precise but changes three actions' return shapes for no visible gain; the newest row is the one just created.

### 4. Console shows "last event"
Workspace state keeps `lastEvent: { type: "run"; runId } | { type: "example"; index } | { type: "submission"; id }`, set on Run/Play/Submit. The console renders a custom run like `RunPanel`'s result, an example play with its input/expected/output/match, or a submission via the existing `SubmissionDetails` (+ `HiddenTestNotice`). Clicking a test row or a history entry also sets it. Collapsed state is persisted in `localStorage` (`workspace-console-collapsed`).

### 5. Play examples = ordinary custom runs + client-side comparison
Main already has custom runs (PR #89): `code_run` table, `createRun`/`getRun`, `useCreateRun`/`useRun`, `useCodeRunner`, `RunPanel`, gated by `useRunsEnabled()` and `contest.allowRuns`, limited to 10/min and one run in flight, and its spec forbids runs from reading tests. Playing an example therefore stays a plain run whose `stdin` is the example input the page already shows; the expected output never leaves the browser.

- `lib/compare-output.ts`: pure `outputsMatch(mode, epsilon, actual, expected)` mirroring `judge/src/compare.rs` (`exact`: trimmed equality; `tokens`: whitespace-split equality; `float`: tokens, numeric tokens within epsilon absolute-or-relative, others equal). Returns `null` for `checker`. Unit tests port the Rust cases (`bun test lib`).
- `hooks/use-example-runs.ts`: per-workspace state `Record<testIndex, { runId, status }>`, `play(index)` and `playAll()` (sequential: awaits each run's terminal status via the React Query cache before starting the next, stops on a create error such as `RATE_LIMITED`). Uses `createRun` through `useCreateRun`; polling through `useRun`.
- The shell's Console hosts the existing stdin box (reusing `RunPanel` internals) for custom Run; example plays render input / expected / stdout / stderr / status / match.
- Compare settings come from the problem: `useProblem` already returns the full row for practice and contest; `getExercise` gets `compareMode` and `floatEpsilon` added to its problem columns.
*Alternatives*: a second `test_run` table + judge path (original plan) duplicates `code_run`; adding test indices to `code_run` would break the merged custom-run spec ("runs never read tests"). Trade-off: no verdict for checker problems and up to 10 plays/min.

### 6. (removed — no judge changes)
The judge is untouched; no version bump for it.

### 7. Routes
- `/problems/[slug]`: server page loads problem, redirects owner-of-draft without `tab` to `/edit`, maps legacy `?tab=` (`results`/`statistics`/`tests` → initial drawer via `?panel=`, `edit` → `/edit`). Renders `ProblemWorkspace`.
- `/problems/[slug]/edit`: server page, owner/admin only (`notFound` otherwise), regular layout with `PageHeader`, `ProblemEditTab` content, Publish/Delete for drafts, and a "Try in workspace" link.
- `/contests/[slug]/problems/[problemSlug]`: server page loads contest + checks the problem belongs to it; the client adapter moves the gate logic from `tabs/problem/index.tsx` (not started countdown, pending join, non-participant before end, solved ⇒ locked editor) into a `ContestProblemGate`. `tabs/problem/index.tsx` becomes a list of problem cards linking to the route; `ContestTabs` redirects `?problem=` to it.
- Exercise route keeps its URL; the page renders `ExerciseWorkspace`.
Drawer state lives in the URL (`?panel=submissions|stats|tests|leaderboard|settings`, via `nuqs`) so drawers are linkable and Back closes them.

### 8. Drafts hook
Extract `UploadCode`'s storage logic into `hooks/use-solution-draft.ts`: `useSolutionDraft({ scope: draftKey, language })` returns `{ code, setCode, onEditorMount, reset, undoReset, savedAt }` with the same rules (slot key `code-<scope>-<language>`, blur/pagehide/slot-switch saves, starter/empty never overwrite, "load saved?" toast when code was typed before a language was chosen). Contest keeps its existing keys (`code-<problemId>-<lang>`) so in-flight contest drafts survive the deploy; practice uses the same key (same problem id ⇒ practice and contest share a draft, which is desirable); exercises use `code-ex-<exerciseId>-<lang>`. Blocks/parsons drafts are out of scope (not persisted today either).

### 9. Narrow screens
`useMediaQuery("(min-width: 1024px)")` picks layout. Narrow: one view visible (`statement | code | results`), others `hidden` via CSS so the single Monaco/Blockly instance stays mounted; bottom tab bar; rail items in a `DropdownMenu` from the top bar. Run/Submit switch to `results`. Same approach the contest layout already uses to avoid duplicate editors.

### 10. Maximize
`CodeEditor` gains optional controlled props `maximized` / `onMaximizedChange`. When provided (inside the shell) it does not apply its own `fixed inset-0` overlay; the shell collapses the statement panel and bottom panels instead (`ResizablePanel` `collapse()` or conditional sizes) and handles Esc with the same "popup open" check. Without the props (any other caller) behavior is unchanged.

## Risks / Trade-offs

- [Run all hits the 10 runs/min limit on problems with many examples] → plays stop with the localized `RATE_LIMITED` message; examples are typically 1–3.
- [TS comparison drifts from `compare.rs`] → same cases ported as unit tests; comment in both files pointing at each other. Indicator is advisory; Submit is authoritative.
- [Path-based chrome hiding drifts when routes change] → single matcher module with unit tests; new editor routes must be added there (noted in `web/CLAUDE.md`).
- [Breaking URLs shared in class materials (`?tab=results`, contest `?problem=`)] → explicit redirects for every old form.
- [Large UI rewrite in three places at once] → shell built and wired to practice first, then contest, then lessons; each step shippable and browser-checked with the test accounts.

## Migration Plan

Web-only deploy, no migration. Example plays appear only where custom runs are enabled (`CUSTOM_RUN_ENABLED`, `contest.allowRuns`). Rollback: revert the web deploy.

## Open Questions

- Batch runs (several stdins in one `code_run`) would make Run all faster and use one rate-limit slot; deferred until Run all latency is a real complaint.
