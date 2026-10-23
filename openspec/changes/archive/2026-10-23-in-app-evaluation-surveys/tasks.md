## 1. Data model

- [x] 1.1 Add `web/drizzle/schemas/surveys.ts`: `survey_form` enum, `survey_response` table (FKs, partial unique indexes, check constraint), relations, and export it from the schema index
- [x] 1.2 Generate and apply the migration (`bun db:generate`, `bun db:migrate`)
- [x] 1.3 Add optional `SURVEY_ADMIN_EMAILS` to `web/env.ts` and the README/CLAUDE.md env list

## 2. Form definitions and scoring

- [x] 2.1 Create `web/lib/surveys/forms.ts` with the four v1 definitions (profile, SUS, feature items with optional flag, open questions) per design.md
- [x] 2.2 Add `Surveys` namespace text to `web/messages/br.json` and `en.json` (consent, SUS, profile, feature items, open questions, UI strings)
- [x] 2.3 Create `web/lib/surveys/schema.ts` that builds the zod answer schema from a definition (required items, allowed values, NA only on optional items, 2000-char open answers, strict keys)
- [x] 2.4 Create `web/lib/surveys/sus.ts` (score + adjective band) with `sus.test.ts` (all-3 → 50, best → 100, worst → 0, band boundaries)

## 3. Server logic

- [x] 3.1 Create `web/lib/surveys/eligibility.ts` (`server-only`): `checkEligibility` and `listEligible` per the four rules
- [x] 3.2 Create `web/lib/surveys/admin.ts` with `isSurveyAdmin`
- [x] 3.3 Server action `getSurvey(form, entityId)`: eligibility, entity name, answered flag (no answer contents of other users)
- [x] 3.4 Server action `submitSurveyResponse`: auth, zod-parse input, eligibility, consent required, compute SUS, insert with explicit columns, map unique violation to "already answered"
- [x] 3.5 Server action `listMySurveys()` for the hub and CTA (pending / answered)
- [x] 3.6 Server action `getSurveyResults(form, entityId?)` gated by `isSurveyAdmin`: counts, SUS stats + band, per-item distributions with NA counts, profile breakdown, open answers, entity filter options
- [x] 3.7 Route handler `app/api/surveys/export/route.ts`: admin gate, anonymized CSV per form

## 4. UI

- [x] 4.1 `hooks/use-surveys.tsx` (queries + submit mutation invalidating hub/CTA; follow mutation-cache-invalidation skill)
- [x] 4.2 `/surveys` hub page (follow creating-a-page skill)
- [x] 4.3 `/surveys/[form]/[entityId]` questionnaire page: consent, profile, SUS, feature items, open questions; not-eligible and already-answered states
- [x] 4.4 `SurveyCta` card + add to contest page (after `endDate`) and lesson page (student after submit; author after first student submission), session-dismissible
- [x] 4.5 `/surveys/results` researcher page: per-form sections, entity filter, SUS summary with band, item distributions, open answers, CSV button
- [x] 4.6 Link to `/surveys` from the user (avatar) menu

## 5. Previews

- [x] 5.0 `SURVEY_PREVIEW_EMAILS` gate (`canPreviewSurveys`), `/surveys/preview/[form]` read-only page (form validates, nothing sent), preview links on the hub

## 6. Verification

- [x] 5.1 `bun test lib` and `bun lint` pass
- [ ] 5.2 Manual run: eligible student submits contest form; second submit rejected; ineligible user gets not-eligible state; non-admin gets 404 on results; CSV has no user id/name/email
