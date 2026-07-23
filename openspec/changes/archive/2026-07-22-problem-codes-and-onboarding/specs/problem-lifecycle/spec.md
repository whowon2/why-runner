## MODIFIED Requirements

### Requirement: Instant draft creation
Clicking "Create Problem" SHALL immediately create a persisted problem with `status = draft` and no required user input, then navigate the user to that problem's edit view. The system SHALL NOT show a multi-step form before the problem row exists.

#### Scenario: User clicks Create Problem
- **WHEN** an authenticated user clicks "Create Problem"
- **THEN** a new problem row is created with `status = draft`, a generated unique slug, a generated unique code, `createdBy` set to the current user, and default placeholder values for title/description
- **AND** the user is navigated to that problem's edit view

## ADDED Requirements

### Requirement: Bulk import also assigns a code
Problems created via bulk import SHALL also be assigned a unique `code` at creation time, following the same generation scheme as problems created through the standard "Create Problem" flow.

#### Scenario: Bulk-imported problem has a code
- **WHEN** an authenticated user imports a batch of problems via the import feature
- **THEN** each imported problem is created with a non-empty, unique `code`
