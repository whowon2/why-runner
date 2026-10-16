## Why

In a contest, a participant's submission list on the Problems tab shows only the time, verdict, and judge report of each attempt — never the code that was submitted. When several attempts get different verdicts, the participant cannot tell which version of their solution produced which result, nor recover an earlier version after editing it in the editor. The practice workspace already shows code in its submission details; contests should match.

## What Changes

- Each attempt in the contest problem submission list (`SubmissionList`) shows the submitted source code and its language when expanded, for every status (including `PENDING`/`RUNNING` attempts that have no judge output yet).
- The code block has a copy-to-clipboard button so the participant can bring an earlier attempt back into the editor.
- The collapsed row also shows the attempt's language next to the time and verdict.
- New i18n keys for the code label, language, and copy feedback in `en.json` and `br.json`.
- The contest code editor auto-saves the current code to localStorage when it loses focus, and shows that it was saved (save button briefly turns into a check, plus a "Saved in this browser at HH:MM" line).
- No server change: `getUserContestSubmissions` already returns `code` and `language`, scoped to the current user only.

## Capabilities

### New Capabilities
- `contest-submission-code-view`: what a contest participant sees of their own past attempts' source code in the contest problem submission list.

### Modified Capabilities
<!-- None: judge report redaction (submission-feedback-visibility) is unchanged; source code is not part of the redacted report. -->

## Impact

- `web/app/[locale]/contests/_components/tabs/problem/submission-list.tsx` — render code + language in each accordion item.
- `web/messages/en.json`, `web/messages/br.json` — new keys under `ContestsPage.Tabs.Problem.Submissions`.
- Possibly reuses `web/components/copy-button.tsx`.
- No DB, server-action, or judge changes.
