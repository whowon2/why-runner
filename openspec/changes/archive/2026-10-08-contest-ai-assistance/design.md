## Context

AI help today lives in `web/lib/actions/get-ai-help.ts`. It is a server action that takes a full `ProblemPreview` and `Submission` object from the browser, calls Gemini (`gemini-2.5-flash`) with the fixed `SYSTEM_INSTRUCTION` from `web/lib/prompt.ts`, and returns markdown. The UI is `AIDialog` (`contests/_components/ai-dialog.tsx`), rendered on each submission row in the contest problem tab (`submission-list.tsx`) and in class exercises (`classes/_components/exercise-detail.tsx`). Responses are cached in `localStorage` under `ai-help-<submissionId>`.

The action only checks that someone is signed in. It trusts the submission object from the client, so a caller can send any code and output and get AI help on it. Submissions already carry `contestId`, which is what lets the server find the contest's level.

## Goals / Non-Goals

**Goals:**
- A per-contest maximum AI assistance level (`off` / `concept` / `hint` / `pinpoint`), set in Settings.
- A graduated ladder in the dialog, revealing one level at a time up to that maximum.
- The server enforces the level and that the submission belongs to the user, so the UI isn't the only gate.

**Non-Goals:**
- Leaderboard penalties or scoring based on hint usage.
- Tracking hint usage on the server, or a teacher view of who used which hints.
- Different levels per problem within a contest.
- Changing AI help for class exercises or lessons.
- Rate limiting or quotas on AI calls.

## Decisions

**1. One ordered Postgres enum column, not a boolean plus a level.**
`contest.ai_assistance` uses a new `contest_ai_assistance` enum `('off','concept','hint','pinpoint')`, `NOT NULL DEFAULT 'off'`. `off` is just the lowest rung, so a single value covers both "toggle" and "level" and rules out invalid combinations such as disabled-but-pinpoint. The order lives in a shared TS constant (`AI_ASSISTANCE_LEVELS`) so the UI and the server compare levels by index.
*Alternative:* an `ai_enabled boolean` plus `ai_level`. Rejected: two fields that can contradict each other, and the form needs extra logic to keep them in step.

**2. Migration backfills existing contests to `hint`; new contests default to `off`.**
The migration adds the column with `DEFAULT 'hint'`, which fills existing rows, then switches the default to `'off'`. Existing contests keep roughly today's behaviour: the current vague prompt is closest to `hint`. New contests are safe for exams by default.
*Alternative:* everything `off`. Rejected: it would silently turn off help on contests already running.

**3. Server action takes ids, not objects: `getAIHelp({ submissionId, level, locale })`.**
The action loads the submission with its problem, checks `submission.userId === currentUser.id`, and then:
- if `contestId` is set, reads `contest.aiAssistance`; throws if it is `off` or the requested level ranks above it;
- if `contestId` is null, ignores `level` and uses the existing single-response prompt, so class exercises are unchanged.

The action does **not** require levels to be requested in order. Ordering is a UX choice; capping is the security rule. Enforcing the order would need server-side state (Non-Goal), and skipping ahead only gives a participant what the creator already allowed.
*Alternative:* keep passing objects and only add a contest-level check. Rejected: an attacker could send any `contestId`-less submission object and skip the cap.

**4. Per-level prompts are added to the user prompt; the shared system instruction is kept.**
`prompt.ts` gets `getAssistanceLevelInstructions(level)`, appended to `getUserPrompt`. It holds strict output rules per level (concept: one short sentence naming the construct, no lines, no code; hint: explain the logic error, no lines or code; pinpoint: line number and the statement to change, no full solution), each with the user's examples as a few-shot anchor. The source code is sent with line numbers (`14 | ...`) only for `pinpoint`, so the model can cite lines reliably and the lower levels don't anchor on them. Block and Parsons answer-mode instructions still apply on top.

**5. The ladder lives only in the client; the cache key includes the level.**
`AIDialog` gets a new prop, `maxLevel` (`AiAssistance | null`; `null` = non-contest). It shows the revealed hints in order and a "Show next hint" button while `nextLevel <= maxLevel`. Each level is cached in `localStorage` under `ai-help-<submissionId>-<level>`; non-contest help keeps the old `ai-help-<submissionId>` key, so existing cached responses still show. Wrap reads and writes in try/catch.
`SubmissionList` already has `contest`. It passes `contest.aiAssistance` and doesn't render `AIDialog` at all when it is `off`.

**6. Settings form uses a select with example text.**
The new `aiAssistance` field sits next to the privacy toggle in `tabs/settings/form.tsx`, as a select whose options show a label plus the example sentence (translated). `update-contest.ts` accepts and validates it against the enum. It stays editable after publish, so a creator can turn help off mid-contest.

## Risks / Trade-offs

- [The LLM ignores level limits, e.g. `concept` leaks the fix] → Strict, short per-level instructions with few-shot examples. Concept is limited to one sentence. Accept some leakage; it is advisory help, not a security boundary.
- [Participants clear `localStorage` and re-request the same level] → Harmless: they get the same level again, still within the cap. It costs extra Gemini calls, which is acceptable without rate limiting (Non-Goal).
- [Line numbers drift from what the editor showed] → Number lines from the stored `submission.code`, exactly as submitted, which the details view also shows.
- [Two places to keep in sync: the enum in the Drizzle schema and the TS order constant] → Derive the constant from the `pgEnum` values array, so there is one source.
- [Changing the `getAIHelp` signature breaks the class-exercise caller] → Update `exercise-detail.tsx` in the same change (`maxLevel={null}`).

## Migration Plan

1. Generate a Drizzle migration: create enum `contest_ai_assistance`, add column `ai_assistance` with `DEFAULT 'hint' NOT NULL`, then `ALTER ... SET DEFAULT 'off'`.
2. Deploy as usual; `migrate-if-production.mjs` runs on build.
3. Rollback: drop the column and the enum. No other table depends on it.

## Resolved Questions

- Passed submissions: the ladder applies only to failed submissions. A passed contest submission gets one optimization response (requested as `concept`, so it is allowed whenever the contest level isn't `off`); the prompt ignores the level for passed submissions.
