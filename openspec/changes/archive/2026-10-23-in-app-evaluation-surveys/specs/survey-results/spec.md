## ADDED Requirements

### Requirement: Researcher-only access
The `/surveys/results` page and every results/export action SHALL be available only to signed-in users whose email appears in the comma-separated `SURVEY_ADMIN_EMAILS` env var (case-insensitive, trimmed). When the variable is unset or empty, nobody SHALL have access.

#### Scenario: Regular user opens results
- **WHEN** a user whose email is not in `SURVEY_ADMIN_EMAILS` opens `/surveys/results` or calls a results action
- **THEN** the page is treated as not found and the action returns no data

### Requirement: Aggregated results per form
For each of the four forms the results page SHALL show: response count, SUS mean, median, standard deviation, and the adjective band of the mean (Bangor et al.), the distribution of 1–5 answers and mean for every Likert item (excluding "Não usei", with the "Não usei" count shown separately), the respondent profile breakdown, and the list of open-ended answers without respondent names or emails.

#### Scenario: Form with no responses
- **WHEN** a form has zero responses
- **THEN** its section shows an empty state with the count 0 and no statistics

#### Scenario: SUS band
- **WHEN** the contest participant form's SUS mean is 72.5
- **THEN** the page shows 72.5 with the band "Bom"

### Requirement: Filter by entity
The results page SHALL allow filtering each form's results to a single contest or lesson, listing only entities that have at least one response.

#### Scenario: Filtering to one contest
- **WHEN** the researcher picks a contest in the contest participant filter
- **THEN** all statistics and open answers for that form are recomputed from that contest's responses only

### Requirement: Anonymized CSV export
The researcher SHALL be able to download a CSV per form with one row per response: response id, form version, entity id and name, submitted date, SUS score, and one column per item and open question. The export SHALL NOT include user id, name, username, or email.

#### Scenario: Export
- **WHEN** the researcher clicks export on the lesson student form
- **THEN** a CSV downloads containing every lesson student response with no personally identifying column
