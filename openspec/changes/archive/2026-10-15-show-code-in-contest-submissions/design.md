## Context

The contest Problems tab renders `SubmissionList` (`web/app/[locale]/contests/_components/tabs/problem/submission-list.tsx`) under the statement. It uses `useProblemSubmissions` → `getUserContestSubmissions` (`web/lib/actions/contest/get-user-submissions.ts`), which already filters by `currentUser.id` (ignoring any client `userId`) and returns full `submission` rows — including `code` and `language` — with `output` passed through `redactSubmission`.

Each attempt is an `AccordionItem` whose trigger shows time + status; content shows `SubmissionDetails` only when `output` is set, plus `AIDialog` when allowed. Code is never rendered. The practice workspace's `SubmissionDetailsDialog` (`problems/_components/workspace/results.tsx`) already renders code in a `<pre>` block, which is the visual precedent.

## Goals / Non-Goals

**Goals:**
- Show each attempt's submitted code and language in the contest submission list.
- Let the participant copy an earlier attempt's code.
- Keep the change UI-only.

**Non-Goals:**
- "Load into editor" / restore button that writes directly into the contest editor (editor state lives in a sibling component; copy-paste covers the need without new cross-component state).
- Syntax highlighting (no highlighter in the repo; plain monospace matches the practice view).
- Showing other participants' code, or changing the owner's Manage → Submissions view.
- Rendering visual (blocks/parsons) sources — contests only accept code-mode submissions.

## Decisions

- **Render code inside the existing accordion content, above the judge report.** Keeps one expand action per attempt; code is the context for reading the verdict. Alternative: a separate "View code" dialog like practice — rejected because the accordion already is the details view and a dialog would add a second click.
- **Show code regardless of `output`.** Move the `submission.output &&` guard so it wraps only `SubmissionDetails`, not the whole content, so pending attempts still show code.
- **Plain `<pre>` with `max-h` + scroll, `whitespace-pre`, monospace, `bg-muted/50`.** Matches `results.tsx` and the existing `CodeBlock` styling in this file. Use `whitespace-pre` (with horizontal scroll) rather than `pre-wrap`/`break-all` so indentation-sensitive code (Python) reads correctly. Neutral text color so the accordion's status color (e.g. `text-red-500`) does not tint the code — apply `text-foreground` on the block.
- **Reuse `components/copy-button.tsx`.** Already handles clipboard + `Common.copied` toast; no new component.
- **Language in the trigger row.** Small muted badge/text between time and status, from `submission.language` (nullable — omit when null).
- **No server change.** Action already scopes to the current user and returns `code`; `code` is the user's own input and is not covered by `submission-feedback-visibility` redaction. Verify only — do not widen columns or relations.

## Risks / Trade-offs

- [Long code makes the list tall inside an already scrolling statement panel] → cap the code block height (`max-h-80`) with its own scroll.
- [Status color classes on `AccordionItem` cascade into code text] → explicit `text-foreground` on the code block.
- [Future change adds a `userId` filter from client input] → spec scenario pins that the action ignores client-supplied user ids.
