## Purpose

Defines the presentation and behavior of the problems list view — a table-based, CSES-style listing of problems with per-problem solve statistics and per-user solved status.

## Requirements

### Requirement: Problems list is displayed as a table
The system SHALL display the problems list as a table with columns for problem code, problem name, creator (linked to their profile), number of users who have solved the problem, and whether the current user has solved it. The list SHALL exclude problems with `status = draft` unless the current user is the problem's creator, in which case their own draft problems SHALL be included and visually marked as "Draft".

#### Scenario: Table columns render
- **WHEN** an authenticated user opens the problems list page
- **THEN** the system SHALL render a table with one row per visible problem, showing the problem's code, name, creator (as a link to the creator's profile), its solved-by count, and a solved/unsolved indicator for the current user in that row

#### Scenario: Existing filters still work
- **WHEN** the user searches by name, filters by difficulty, filters to "my problems", or paginates
- **THEN** the table SHALL update to reflect the filtered/paginated set exactly as the previous list view did, still subject to draft visibility rules

#### Scenario: Other users' drafts are hidden
- **WHEN** a user views the problems list
- **THEN** problems with `status = draft` created by other users SHALL NOT appear in the table

#### Scenario: Own drafts are shown with a draft indicator
- **WHEN** a user who has created draft problems views the problems list
- **THEN** their own `status = draft` problems SHALL appear in the table marked with a "Draft" indicator

### Requirement: Solved-by count reflects distinct users with a passed submission
The system SHALL compute the solved-by count for a problem as the number of distinct users with at least one submission with status `PASSED` for that problem.

#### Scenario: Count updates after a new solve
- **WHEN** a user submits a solution to a problem and it is graded `PASSED` for the first time by that user
- **THEN** the problem's solved-by count SHALL increase by 1 the next time the list is loaded

#### Scenario: Repeat solves do not double count
- **WHEN** a user who has already solved a problem submits another `PASSED` solution to the same problem
- **THEN** the solved-by count for that problem SHALL NOT increase

### Requirement: Per-user solved indicator reflects the viewer only
The system SHALL show the solved indicator for a problem row based only on whether the currently authenticated user has a `PASSED` submission for that problem, not any other user.

#### Scenario: Unsolved problem
- **WHEN** the current user has no `PASSED` submission for a problem
- **THEN** that problem's row SHALL show an unsolved indicator

#### Scenario: Solved problem
- **WHEN** the current user has at least one `PASSED` submission for a problem
- **THEN** that problem's row SHALL show a solved indicator
