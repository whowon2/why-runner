## MODIFIED Requirements

### Requirement: Problems list is displayed as a table
The system SHALL display the problems list as a table with columns for problem name, number of users who have solved the problem, and whether the current user has solved it. The list SHALL exclude problems with `status = draft` unless the current user is the problem's creator, in which case their own draft problems SHALL be included and visually marked as "Draft".

#### Scenario: Table columns render
- **WHEN** an authenticated user opens the problems list page
- **THEN** the system SHALL render a table with one row per visible problem, showing the problem's name, its solved-by count, and a solved/unsolved indicator for the current user in that row

#### Scenario: Existing filters still work
- **WHEN** the user searches by name, filters by difficulty, filters to "my problems", or paginates
- **THEN** the table SHALL update to reflect the filtered/paginated set exactly as the previous list view did, still subject to draft visibility rules

#### Scenario: Other users' drafts are hidden
- **WHEN** a user views the problems list
- **THEN** problems with `status = draft` created by other users SHALL NOT appear in the table

#### Scenario: Own drafts are shown with a draft indicator
- **WHEN** a user who has created draft problems views the problems list
- **THEN** their own `status = draft` problems SHALL appear in the table marked with a "Draft" indicator
