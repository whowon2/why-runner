# query-cache-invalidation Specification

## Purpose

Ensure that mutations across the app (contest problem management, join approvals, submissions, profile edits, contest creation) invalidate the appropriate cached queries so affected views update immediately without requiring a manual page refresh.
## Requirements
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

### Requirement: Contest deletion refreshes contest lists
Deleting a contest SHALL invalidate cached contest list queries so the deleted contest no longer appears in any list view, and this invalidation SHALL be guaranteed by the mutation itself rather than depending on the calling component to trigger it.

#### Scenario: Deleted contest disappears from the contests list
- **WHEN** the creator deletes a contest from the Danger Zone and is redirected to the contests list page
- **THEN** the deleted contest is not shown in the list, without requiring a manual page refresh

### Requirement: Contest leaderboard refreshes on participant and problem changes
Joining or leaving a contest, approving or rejecting a pending join, and adding, removing, or reordering contest problems SHALL invalidate that contest's leaderboard query (`["contest-leaderboard", contestId]`), with the invalidation living in the mutation hook (or the single mutation call site when there is no hook).

#### Scenario: Approved participant appears on the leaderboard
- **WHEN** the owner approves a pending join request
- **THEN** the contest leaderboard refetches and lists the newly accepted participant

#### Scenario: Leaving removes the row
- **WHEN** a participant leaves the contest
- **THEN** the contest leaderboard refetches without their row

### Requirement: Class gradebook refreshes when its inputs change
Mutations that change which lessons/exercises a class gradebook lists, or which lessons a student has handed in, SHALL invalidate the class queries: publishing/unpublishing a lesson, adding, moving or removing a lesson exercise, updating or deleting a lesson, removing a member, and submitting a lesson. Lesson update, publish and delete mutations SHALL invalidate only that lesson's class (`["classes", classroomId]` prefix, which covers `["classes", classroomId, "gradebook"]` and `["classes", classroomId, "lessons"]`), falling back to the `["classes"]` prefix only when the class id is unknown. Other mutations in this list MAY keep invalidating the `["classes"]` prefix.

#### Scenario: Professor publishes a lesson then opens the gradebook
- **WHEN** the class owner publishes a lesson and then navigates to the class gradebook in the same session
- **THEN** the gradebook SHALL be refetched and include that lesson's exercise columns

#### Scenario: Professor adds an exercise to a published lesson
- **WHEN** the class owner adds an exercise to a published lesson
- **THEN** any cached gradebook for that class SHALL be invalidated so the new column appears

#### Scenario: Lesson update leaves other classes alone
- **WHEN** the class owner changes a lesson's due date in class A while class B's queries are cached
- **THEN** class A's queries are invalidated and class B's queries are not

### Requirement: Lesson settings update optimistically
Lesson update and publish mutations SHALL write the new values into the cached `["lessons", lessonId]` data before the server responds, roll that cache back and show an error toast if the server rejects the change, and refetch `["lessons", lessonId]` once the mutation settles. Exercise queries (`["exercises", …]`), which carry the lesson's due date and output visibility, SHALL be marked stale without being refetched immediately; they refetch when next shown.

#### Scenario: Toggling a lesson setting
- **WHEN** the lesson owner flips a lesson setting switch (e.g. show expected outputs)
- **THEN** the switch shows the new state immediately, and at most the lesson query and that class's active queries are refetched

#### Scenario: Server rejects the change
- **WHEN** the update fails (e.g. the session expired)
- **THEN** the setting returns to its previous value and an error toast is shown

#### Scenario: Student exercise page after a change
- **WHEN** the owner changes the due date and then opens one of the lesson's exercises in the same session
- **THEN** the exercise page shows the new due date

