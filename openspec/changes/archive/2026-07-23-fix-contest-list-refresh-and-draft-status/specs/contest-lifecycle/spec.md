## ADDED Requirements

### Requirement: Draft status display is independent of dates
While a contest's `status` is `draft`, the system SHALL display and treat it as `draft` regardless of whether `startDate`/`endDate` are set, in the future, in progress, or in the past. Only the explicit publish action SHALL change a contest's displayed/effective status away from `draft`.

#### Scenario: Draft with a past-dated range still shows as draft
- **WHEN** a draft contest has a `startDate` and `endDate` that have already passed
- **THEN** the contest list and contest detail page display it as `draft`, not `past`

#### Scenario: Draft with a current date range still shows as draft
- **WHEN** a draft contest has a `startDate` in the past and `endDate` in the future (i.e. dates that would otherwise imply "active")
- **THEN** the contest list and contest detail page display it as `draft`, not `active`

#### Scenario: Draft with a future date range still shows as draft
- **WHEN** a draft contest has a `startDate` and `endDate` both in the future
- **THEN** the contest list and contest detail page display it as `draft`, not `upcoming`

#### Scenario: Editing dates on a draft does not publish it
- **WHEN** the creator edits and saves start/end dates on a draft contest via the Settings form
- **THEN** the contest's `status` remains `draft` in the database and in the UI, without requiring the explicit publish action
