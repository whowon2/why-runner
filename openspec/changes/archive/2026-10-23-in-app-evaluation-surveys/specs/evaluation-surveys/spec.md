## ADDED Requirements

### Requirement: Four entity-bound questionnaires
The system SHALL offer exactly four survey forms, identified by `survey_form` values `contest_author`, `contest_participant`, `lesson_author`, and `lesson_student`. Contest forms SHALL be bound to one contest and lesson forms SHALL be bound to one lesson. Each form's content SHALL be defined in code with a version number stored on every response.

#### Scenario: Opening a contest participant survey
- **WHEN** an eligible student opens `/surveys/contest_participant/{contestId}`
- **THEN** the page shows the contest participant questionnaire with the contest's name in its header

#### Scenario: Unknown form or mismatched entity
- **WHEN** a user opens a survey URL whose form is not one of the four values, or whose entity id does not exist for that form's entity type
- **THEN** the page is treated as not found

### Requirement: Questionnaire structure
Each form SHALL contain, in order: a consent term the respondent must accept, a short respondent profile section, the ten standard SUS items in their standard order, the form's feature-specific Likert items, and open-ended questions. All Likert items SHALL use a 1–5 scale from "Discordo totalmente" to "Concordo totalmente". Feature-specific items about optional features SHALL also offer "Não usei". SUS items SHALL NOT offer "Não usei". Portuguese text SHALL be authoritative.

#### Scenario: Respondent declines consent
- **WHEN** the respondent does not tick the consent checkbox
- **THEN** the submit control stays disabled and the server rejects a submission without consent

#### Scenario: Optional feature not used
- **WHEN** a student never opened AI help and picks "Não usei" on the AI help item
- **THEN** the answer is stored as not applicable and excluded from that item's averages

### Requirement: Eligibility
The system SHALL check eligibility on the server both when rendering a survey and when accepting a submission:
- `contest_author`: the user is the contest's `createdBy` and the contest is `published` with at least one problem.
- `contest_participant`: the user has an `accepted` `userOnContest` row for the contest and at least one submission in it.
- `lesson_author`: the user is the lesson's `createdBy`, the lesson is published, and it has at least one exercise.
- `lesson_student`: the user has a `lessonSubmission` row for the lesson.

#### Scenario: Ineligible user calls the submit action directly
- **WHEN** a user who never joined a contest POSTs a `contest_participant` submission for it
- **THEN** the action rejects it and no row is written

#### Scenario: Professor opens the student form for their own lesson
- **WHEN** the lesson author opens `/surveys/lesson_student/{lessonId}` without a lesson submission of their own
- **THEN** the page explains they are not eligible for this form and links to the `lesson_author` form instead

### Requirement: Answer validation and SUS scoring
The submit action SHALL parse answers with a zod schema generated from the form definition: every required item answered, values within the allowed set, open-ended answers trimmed and capped at 2000 characters, unknown keys rejected. The server SHALL compute the SUS score (odd items contribute `answer − 1`, even items `5 − answer`, sum × 2.5, range 0–100) and store it; the client SHALL NOT send a score.

#### Scenario: All SUS items at neutral
- **WHEN** a respondent answers 3 on all ten SUS items
- **THEN** the stored SUS score is 50

#### Scenario: Missing required item
- **WHEN** a submission omits SUS item 7
- **THEN** the action rejects it with a field error and no row is written

### Requirement: One response per user, form, and entity
The system SHALL store at most one response per user × form × entity. After submitting, revisiting the survey SHALL show a read-only "already answered" state. Responses SHALL NOT be editable or deletable by respondents.

#### Scenario: Double submit
- **WHEN** the same user submits the same form for the same contest twice (e.g. two tabs)
- **THEN** the second submission is rejected and the first response is kept unchanged

### Requirement: Survey hub and entry points
The system SHALL provide a `/surveys` page listing every form × entity the current user is eligible for, split into pending and answered. The contest page SHALL show a survey call-to-action card to an eligible user who has not answered, only after the contest's `endDate`. The lesson page SHALL show the card to an eligible student after they submit the lesson, and to the author once the lesson has at least one student submission. The card SHALL be dismissible for the current session without affecting eligibility.

#### Scenario: Live contest
- **WHEN** an eligible participant views a contest that has not ended
- **THEN** no survey card is shown on the contest page

#### Scenario: Student just submitted the lesson
- **WHEN** a student submits a lesson to the professor and returns to the lesson page
- **THEN** a card invites them to the `lesson_student` survey for that lesson

### Requirement: Response privacy
Survey responses SHALL NOT be readable by professors, contest authors, or other students through any action or page. Only the researcher view in `survey-results` SHALL read responses.

#### Scenario: Professor tries to read student answers
- **WHEN** a lesson author calls any survey action for their lesson
- **THEN** no other user's answers are returned

### Requirement: Read-only form previews
The system SHALL offer `/surveys/preview/{form}` for each of the four forms to signed-in users whose email is in the comma-separated `SURVEY_PREVIEW_EMAILS` env var or who are survey admins. A preview SHALL render the same questionnaire with the same client-side validation, SHALL NOT be bound to any contest or lesson, and SHALL NOT call the submit action or store anything. The `/surveys` hub SHALL list the four previews for such users. Anyone else SHALL get not found.

#### Scenario: Advisor previews the lesson author form
- **WHEN** a user listed in `SURVEY_PREVIEW_EMAILS` opens `/surveys/preview/lesson_author`, fills every item and clicks submit
- **THEN** the page confirms the answers are valid and that nothing was saved, and no `survey_response` row is written

#### Scenario: Regular user opens a preview
- **WHEN** a user not listed in either env var opens `/surveys/preview/contest_author`
- **THEN** the page is treated as not found
