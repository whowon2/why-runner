## MODIFIED Requirements

### Requirement: Read-only form previews
The system SHALL offer `/surveys/preview/{form}` for each of the four forms to signed-in users whose email is in the comma-separated `SURVEY_PREVIEW_EMAILS` env var or whose role is `admin`. A preview SHALL render the same questionnaire with the same client-side validation, SHALL NOT be bound to any contest or lesson, and SHALL NOT call the submit action or store anything. The `/surveys` hub SHALL list the four previews for such users. Anyone else SHALL get not found.

#### Scenario: Advisor previews the lesson author form
- **WHEN** a user listed in `SURVEY_PREVIEW_EMAILS` opens `/surveys/preview/lesson_author`, fills every item and clicks submit
- **THEN** the page confirms the answers are valid and that nothing was saved, and no `survey_response` row is written

#### Scenario: Admin previews a form
- **WHEN** an admin not listed in `SURVEY_PREVIEW_EMAILS` opens `/surveys/preview/contest_author`
- **THEN** the preview renders

#### Scenario: Regular user opens a preview
- **WHEN** a non-admin user not listed in `SURVEY_PREVIEW_EMAILS` opens `/surveys/preview/contest_author`
- **THEN** the page is treated as not found
