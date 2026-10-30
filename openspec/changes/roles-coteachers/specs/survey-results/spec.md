## MODIFIED Requirements

### Requirement: Researcher-only access
The `/surveys/results` page and every results/export action SHALL be available only to signed-in users with `role = 'admin'`. The `SURVEY_ADMIN_EMAILS` env var SHALL NOT grant access at runtime; it is only an input to the admin seed script.

#### Scenario: Regular user opens results
- **WHEN** a user whose role is `user` opens `/surveys/results` or calls a results action
- **THEN** the page is treated as not found and the action returns no data

#### Scenario: Admin opens results
- **WHEN** an admin opens `/surveys/results`
- **THEN** the aggregated results are shown

#### Scenario: Email listed but not admin
- **WHEN** a user whose email is in `SURVEY_ADMIN_EMAILS` but whose role is `user` opens `/surveys/results`
- **THEN** the page is treated as not found
