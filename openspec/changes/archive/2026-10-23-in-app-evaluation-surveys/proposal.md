## Why

The thesis (`overleaf/main.tex`, Future Work) and the TCC audit both mark classroom evaluation as the missing piece: WhyRunner has been used in a real contest but there's no measurable satisfaction/usability data. Running the survey inside WhyRunner lets every answer be tied to the exact contest or exercise list the respondent used, restricted to people who actually used it, and scored automatically (SUS) for the defense.

## What Changes

- Four Portuguese questionnaires, each tied to one real entity:
  - **Contest author**: professor who created a contest.
  - **Contest participant**: student who took part in a contest and submitted.
  - **Lesson author**: professor who created a class lesson (exercise list).
  - **Lesson student**: student who submitted that lesson to the professor.
- Each questionnaire = consent term (TCLE) + short respondent profile + the 10 standard SUS items + feature-specific Likert items (with "Não usei" where a feature is optional) + open-ended questions.
- New `survey_response` table storing answers (jsonb), questionnaire version, computed SUS score, consent timestamp; one response per user × form × entity.
- Eligibility enforced server-side per form (owner of the contest/lesson, or accepted participant with ≥1 submission / student with a lesson submission).
- Entry points: a `/surveys` hub listing the user's pending and answered surveys, plus a call-to-action card on the contest page (after the contest ends) and on the lesson page (after the student submits / once the author has a submission to look at).
- Researcher-only results page (`/surveys/results`), gated by a `SURVEY_ADMIN_EMAILS` env var: per-form response count, SUS mean/median/SD with adjective band, per-item distributions, open-ended answers (anonymous), filter by contest/lesson, CSV export.
- Professors do **not** see their students' answers, so students can answer honestly about their own professor's class.

## Capabilities

### New Capabilities
- `evaluation-surveys`: the four questionnaires, eligibility rules, consent, answer validation, SUS scoring, storage, one-response rule, and the in-app entry points.
- `survey-results`: researcher-only aggregated results view and anonymized CSV export.

### Modified Capabilities
<!-- None: contest and lesson pages only gain an extra card; no existing requirement changes. -->

## Impact

- **DB**: new `survey_form` enum + `survey_response` table (`web/drizzle/schemas/surveys.ts`) + migration. No judge changes (judge doesn't touch these tables).
- **Server actions**: new `web/lib/actions/surveys/` (eligibility, submit, list pending, results, export).
- **Pages**: `web/app/[locale]/surveys/`, `/surveys/[form]/[entityId]`, `/surveys/results`; small CTA components added to the contest page and lesson page.
- **Env**: new optional `SURVEY_ADMIN_EMAILS` in `web/env.ts`.
- **i18n**: questionnaire text under a new `Surveys` namespace in `web/messages/br.json` (authoritative) and `en.json`.
- **Thesis**: results feed the Evaluation section; questionnaire text can be copied into an appendix.
