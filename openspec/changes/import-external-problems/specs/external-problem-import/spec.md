## ADDED Requirements

### Requirement: Fetch problem from external source
The system SHALL allow an authenticated admin to fetch a problem from a supported external judge source by providing a source identifier and a problem reference (contest id + index, or a problem URL for that source).

#### Scenario: Successful fetch from Codeforces
- **WHEN** an admin submits a valid Codeforces contest id and problem index (or a valid Codeforces problem URL)
- **THEN** the system fetches the problem's statement, difficulty rating, and publicly listed sample input/output pairs, and returns a normalized draft problem for preview

#### Scenario: Problem reference does not exist
- **WHEN** an admin submits a contest id/index or URL that does not correspond to an existing problem on the source
- **THEN** the system returns an error and does not create any draft or database row

#### Scenario: Non-admin attempts fetch
- **WHEN** a user without admin/import permission calls the fetch action
- **THEN** the system rejects the request with an authorization error and performs no external request

### Requirement: Normalize external problem into WhyRunner format
The system SHALL normalize a fetched external problem into the same shape accepted by the existing manual JSON import (`title`, `description`, `difficulty`, `exampleCount`, `inputs[]`, `outputs[]`).

#### Scenario: Rating maps to difficulty
- **WHEN** the source problem has a numeric difficulty rating
- **THEN** the system maps it to `easy`, `medium`, or `hard` using a fixed rating-to-difficulty table

#### Scenario: No rating available
- **WHEN** the source problem has no difficulty rating
- **THEN** the system sets `difficulty` to `null` rather than failing the fetch

#### Scenario: Samples fail to parse
- **WHEN** the source problem page's sample-test markup cannot be parsed into input/output pairs
- **THEN** the system returns the draft with empty `inputs`/`outputs` and a warning, instead of throwing an error

### Requirement: Admin preview before persisting
The system SHALL present the normalized draft to the admin for review and edits before any database write occurs, and SHALL only persist the problem on an explicit confirmation action.

#### Scenario: Admin edits and confirms
- **WHEN** an admin edits the fetched draft's fields and submits confirmation
- **THEN** the system validates the edited draft with the same rules as manual JSON import and inserts exactly one problem row attributed to the admin

#### Scenario: Admin discards draft
- **WHEN** an admin fetches a draft and navigates away or cancels without confirming
- **THEN** no problem row is created

### Requirement: Pluggable source adapters
The system SHALL implement external source integrations behind a common adapter interface so additional sources can be added without changes to the fetch action's public contract or the admin UI's confirmation flow.

#### Scenario: Unsupported source requested
- **WHEN** an admin requests a fetch for a source identifier with no registered adapter
- **THEN** the system returns a clear "unsupported source" error without attempting any external request
