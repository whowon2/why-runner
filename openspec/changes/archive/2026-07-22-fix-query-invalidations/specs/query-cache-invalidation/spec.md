## ADDED Requirements

### Requirement: Follow/unfollow refreshes follower and following lists
When a user follows or unfollows another user, the system SHALL invalidate cached followers/following list queries so any open followers/following view reflects the change without a manual refresh.

#### Scenario: Follow list tab updates after following a user
- **WHEN** a user follows another user and then navigates to (or has open) a followers or following list tab
- **THEN** the list reflects the new follow relationship without requiring a manual page refresh

#### Scenario: Follow list tab updates after unfollowing a user
- **WHEN** a user unfollows another user and then navigates to (or has open) a followers or following list tab
- **THEN** the list no longer includes the unfollowed relationship without requiring a manual page refresh

### Requirement: Contest problem list refreshes on add/remove
Adding or removing a problem from a contest SHALL invalidate the contest's cached data so the problem list updates immediately, and this invalidation SHALL be guaranteed by the mutation itself rather than depending on the calling component to trigger it.

#### Scenario: Problem list updates after adding a problem
- **WHEN** an admin adds a problem to a contest
- **THEN** the contest's problem list reflects the addition without requiring a manual page refresh

#### Scenario: Problem list updates after removing a problem
- **WHEN** an admin removes a problem from a contest
- **THEN** the contest's problem list no longer includes the removed problem without requiring a manual page refresh

### Requirement: Approving or rejecting a pending contest join refreshes participants
When an admin approves or rejects a pending contest join request, the system SHALL invalidate the contest's participants list and the affected user's contest status so both reflect the decision immediately.

#### Scenario: Participants list updates after approval
- **WHEN** an admin approves a pending join request
- **THEN** the participants list includes the newly approved user without requiring a manual page refresh

#### Scenario: Pending list and status update after rejection
- **WHEN** an admin rejects a pending join request
- **THEN** the pending-joins list no longer includes that request, and the rejected user's contest status reflects the rejection without requiring a manual page refresh

### Requirement: Submission upload refreshes both problem and contest submission views
Uploading a submission for a contest problem SHALL invalidate both the problem-scoped submissions query and the contest-scoped submissions query, so a submission appears in the problem's own submission history and in a contest admin's live submissions view.

#### Scenario: Contest admin sees new submission without refresh
- **WHEN** a competitor uploads a submission for a problem in a contest that an admin is currently viewing the submissions/management tab for
- **THEN** the new submission appears in the admin's submissions view without requiring a manual page refresh

### Requirement: Profile update refreshes profile view
Updating a user's profile (e.g. username) SHALL invalidate that user's cached profile query so the profile header reflects the change immediately.

#### Scenario: Profile header updates after edit
- **WHEN** a user updates their username via the profile edit form
- **THEN** the profile header shows the updated username without requiring a manual page refresh or navigation

### Requirement: Contest creation refreshes contest lists
Creating a contest SHALL invalidate cached contest list queries, including list views scoped to the creating user's own contests, so the new contest appears immediately regardless of which page triggered creation.

#### Scenario: New contest appears in "My Contests"
- **WHEN** a user creates a contest from the "My Contests" page
- **THEN** the new contest appears in that page's list without requiring a manual page refresh
