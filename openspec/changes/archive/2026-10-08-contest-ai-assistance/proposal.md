## Why

AI help on submissions is currently always on and always at one fixed "helpful but vague" level, so a contest creator can't run a no-help exam or tune how much the AI gives away. Teachers using contests as graded assessments need to switch AI help off; teachers using them as practice want to control how far a hint goes, from a broad nudge ("For loop badly implemented") to a pointed fix ("Missing a break on line 14").

## What Changes

- Contest creators can choose an **AI assistance level** per contest in the Settings tab: `off`, `concept`, `hint`, or `pinpoint`.
  - `concept`: names the area of the problem only — e.g. "For loop badly implemented".
  - `hint`: explains what is wrong without locating it — e.g. "You forgot to exit the loop".
  - `pinpoint`: points to the exact place and fix — e.g. "Missing a break on line 14".
- Levels are a ladder: the setting is the **maximum** level. On a failed contest submission, a participant first asks for the `concept` hint and can then reveal the next level, one step at a time, up to the contest's maximum.
- When the level is `off`, the AI help button is not shown on contest submissions, and the server refuses AI help requests for that contest.
- The AI help server action loads the submission from the database and checks that it belongs to the current user, instead of trusting a submission object sent by the browser. The contest's level is enforced on the server.
- New contests default to `off`. Existing contests are migrated to `hint`, which matches today's behaviour.
- AI help outside contests (class exercises) is unchanged.

## Capabilities

### New Capabilities
- `contest-ai-assistance`: per-contest AI assistance level, the graduated hint ladder on contest submissions, and server-side enforcement of the level.

### Modified Capabilities
- `contest-settings`: the Settings configuration form gains the AI assistance level field.

## Impact

- **DB**: new `ai_assistance` enum column on `contest` (Drizzle migration in `web/drizzle/`). The judge doesn't read it, so no change to `judge/src/models.rs`.
- **Server actions**: `web/lib/actions/get-ai-help.ts` (new signature: submission id + requested level), `web/lib/actions/contest/update-contest.ts`, `create-contest.ts`.
- **Prompts**: `web/lib/prompt.ts` gets per-level instructions.
- **UI**: `contests/_components/tabs/settings/form.tsx` (level selector), `contests/_components/ai-dialog.tsx` (stepwise reveal, hidden when off), `contests/_components/tabs/problem/submission-list.tsx`, and `classes/_components/exercise-detail.tsx` (calls the new `AIDialog` API).
- **Hook**: `web/hooks/use-ai-help.tsx`.
- **i18n**: new keys in `web/messages/en.json` and `web/messages/br.json`.
