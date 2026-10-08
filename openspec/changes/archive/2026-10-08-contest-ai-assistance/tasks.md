## 1. Data model

- [x] 1.1 Add `ContestAiAssistance` pgEnum (`off`, `concept`, `hint`, `pinpoint`) and `aiAssistance` column (`ai_assistance`, not null, default `off`) to `web/drizzle/schemas/contests.ts`; export `AI_ASSISTANCE_LEVELS` (from the enum values) and an `AiAssistance` type
- [x] 1.2 Generate the Drizzle migration and edit it so existing rows are backfilled to `hint` and the column default ends up `off`
- [x] 1.3 Run the migration locally and confirm existing contests read `hint` and a newly inserted contest reads `off`

## 2. Server: settings

- [x] 2.1 Accept and validate `aiAssistance` in `web/lib/actions/contest/update-contest.ts`
- [x] 2.2 Make sure `create-contest.ts` relies on the `off` default (no explicit value) and that `get-contest-by-id.ts` returns the column

## 3. Server: AI help

- [x] 3.1 Add `getAssistanceLevelInstructions(level)` to `web/lib/prompt.ts` with strict per-level rules and the example sentences as anchors; number source lines only for `pinpoint`
- [x] 3.2 Change `getAIHelp` to `({ submissionId, level, locale })`: load the submission and problem from the DB, reject if `submission.userId !== currentUser.id`
- [x] 3.3 For contest submissions, load `contest.aiAssistance` and reject when it is `off` or `level` ranks above it; otherwise build the prompt with the level instructions
- [x] 3.4 For non-contest submissions, ignore `level` and keep the existing single-response prompt
- [x] 3.5 Update `web/hooks/use-ai-help.tsx` to the new input shape

## 4. UI

- [x] 4.1 Add an AI assistance select to `contests/_components/tabs/settings/form.tsx` (schema, default values, submit payload), each option showing its example sentence
- [x] 4.2 Rework `contests/_components/ai-dialog.tsx`: take `submissionId` and `maxLevel: AiAssistance | null`; when `maxLevel` is set, show revealed hints in order with a "Show next hint" button up to `maxLevel`, caching each level under `ai-help-<id>-<level>`; when `null`, keep the single-response flow and the `ai-help-<id>` key; wrap `localStorage` in try/catch
- [x] 4.3 In `contests/_components/tabs/problem/submission-list.tsx`, hide `AIDialog` when `contest.aiAssistance === "off"`, otherwise pass `maxLevel={contest.aiAssistance}`
- [x] 4.4 Update `classes/_components/exercise-detail.tsx` to the new `AIDialog` props with `maxLevel={null}`
- [x] 4.5 Add i18n keys to `web/messages/en.json` and `web/messages/br.json`: field label/description, level names, example sentences, ladder labels ("Show next hint", level headings), and the error shown when help is disabled

## 5. Verification

- [x] 5.1 `npx tsc --noEmit` and `bun run lint` pass in `web/`
- [x] 5.2 Manual: set the local contest to `pinpoint`, submit a failing solution, step through concept → hint → pinpoint, reopen the dialog and see all three cached
- [x] 5.3 Manual: set the level to `concept` and confirm no "next hint" button after the first hint; set it to `off` and confirm the button is gone
- [x] 5.4 Manual: call `getAIHelp` with a level above the cap and with another user's submission id, and confirm both are rejected without a Gemini call
- [x] 5.5 Manual: class exercise AI help still works as before
- [x] 5.6 Resolve the design's open question (passed submissions) and update the spec if behaviour differs
