## MODIFIED Requirements

### Requirement: Contest problem list mutations require ownership
Adding, removing, or reordering problems on a contest SHALL require the current user to be the contest's creator or an admin. These operations SHALL be rejected once a published contest's `startDate` has passed, for admins too. Adding a problem SHALL be rejected when the problem is a draft created by another user, unless the caller is an admin.

#### Scenario: Non-owner removes a problem
- **WHEN** a user who neither created the contest nor is an admin calls the remove-problem action
- **THEN** the action SHALL fail as Forbidden and the problem SHALL stay attached

#### Scenario: Admin reorders problems
- **WHEN** an admin reorders problems on another user's contest that has not started
- **THEN** the new order SHALL be saved

#### Scenario: Unauthenticated removal
- **WHEN** a request with no session calls the remove-problem action
- **THEN** the action SHALL not modify any data

#### Scenario: Attaching someone else's draft
- **WHEN** a contest owner who is not an admin attaches a draft problem created by another user
- **THEN** the action SHALL fail as not found

### Requirement: Draft contests are hidden on slug lookup
Looking up a contest by slug SHALL return nothing to anyone except the creator and admins while the contest is a draft.

#### Scenario: Non-owner opens a draft contest URL
- **WHEN** a user who is neither the creator nor an admin opens a draft contest's slug URL
- **THEN** the page SHALL be treated as not found

#### Scenario: Admin opens a draft contest URL
- **WHEN** an admin opens another user's draft contest slug URL
- **THEN** the contest page SHALL render
