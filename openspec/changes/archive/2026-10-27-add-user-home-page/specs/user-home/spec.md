## ADDED Requirements

### Requirement: Authenticated home route
The system SHALL serve a personal home page at `/home` (locale-prefixed like every page) only to signed-in users who finished onboarding. Anonymous visitors SHALL be redirected to sign-in with `redirectTo=/home`; signed-in users who have not finished onboarding SHALL be redirected to onboarding.

#### Scenario: Anonymous visitor opens /home
- **WHEN** a visitor without a session requests `/home`
- **THEN** they are redirected to `/auth/signin?redirectTo=%2Fhome`

#### Scenario: Onboarded user opens /home
- **WHEN** a signed-in, onboarded user requests `/home`
- **THEN** the home page renders with their widgets

### Requirement: Pending class exercises widget
The home page SHALL list the current user's pending class assignments: published lessons in classes they are a member of (excluding classes they own) that they have not yet submitted (no `lesson_submission` row). Each item SHALL show the lesson title, class name, due date, and exercise progress (passed / total), and link to the lesson. Items SHALL be ordered by due date ascending with undated lessons last, limited to 5. Lessons whose due date has passed SHALL be visibly marked overdue.

#### Scenario: Student with an unsubmitted lesson
- **WHEN** a student belongs to a class with a published lesson they have not submitted
- **THEN** the lesson appears in the pending list with its class name, due date and progress

#### Scenario: Submitted lesson is not pending
- **WHEN** the student has submitted that lesson
- **THEN** it no longer appears in the pending list

#### Scenario: Draft lesson is hidden
- **WHEN** a lesson in the student's class is unpublished
- **THEN** it does not appear in the pending list

#### Scenario: Overdue lesson
- **WHEN** an unsubmitted lesson's due date is in the past
- **THEN** it is shown with an overdue marker

### Requirement: Running contest widget
The home page SHALL show the published contests the user participates in with `joinStatus = accepted` that are running now (`startDate ≤ now < endDate`), each with its name, time remaining, and a link to the contest. If none is running, the widget SHALL be hidden or show an empty state.

#### Scenario: User is in a live contest
- **WHEN** the user is an accepted participant of a published contest whose window contains the current time
- **THEN** that contest is shown with a countdown to its end and a link

#### Scenario: Pending join is not shown as running
- **WHEN** the user's join request to a running contest is still `pending`
- **THEN** that contest is not shown in the running widget

### Requirement: Last joined contest widget
The home page SHALL show the contest the user joined most recently (by `user_on_contest.joined_at`, falling back to the contest's start date for rows without one), with its name, status (upcoming / running / finished) and a link. It SHALL NOT duplicate a contest already shown in the running widget.

#### Scenario: User joined several contests
- **WHEN** the user joined contest A, then later contest B
- **THEN** the widget shows contest B

#### Scenario: Last joined is the running one
- **WHEN** the most recently joined contest is also currently running
- **THEN** the widget shows the next most recent joined contest, or its empty state if there is none

### Requirement: Recently solved problems widget
The home page SHALL list up to 5 distinct problems for which the user has a `PASSED` submission, ordered by the most recent passing submission first, each with title, code, difficulty, and a link to the problem.

#### Scenario: Multiple passes on the same problem
- **WHEN** the user passed problem P twice and problem Q once afterwards
- **THEN** Q is listed first and P appears only once

#### Scenario: No solved problems
- **WHEN** the user has no passing submission
- **THEN** the widget shows an empty state linking to `/problems`

### Requirement: Suggestions widget
The home page SHALL suggest up to 3 published problems the user has not solved and did not author, preferring problems whose tags overlap those of problems the user solved and whose difficulty is closest to the user's recent solves (falling back to easiest-first for new users). It SHALL also suggest up to 3 public, published contests that have not ended and that the user has not joined, soonest start first.

#### Scenario: Solved problems are never suggested
- **WHEN** the user has passed problem P
- **THEN** P is not among the suggested problems

#### Scenario: New user gets easy problems
- **WHEN** the user has no solved problems
- **THEN** suggested problems are drawn from the easiest published problems

#### Scenario: Joined and private contests are not suggested
- **WHEN** a contest is private, ended, or already joined by the user
- **THEN** it is not among the suggested contests

### Requirement: Widget empty states
Every home widget SHALL render a localized empty state with a link to the related section (`/classes`, `/contests`, `/problems`) instead of disappearing silently, except the running contest widget, which MAY be omitted when empty.

#### Scenario: Brand-new user
- **WHEN** a user with no classes, contests or submissions opens `/home`
- **THEN** each widget shows its empty state and suggestions still render

### Requirement: Home data is scoped to the current user
The server action(s) backing the home page SHALL derive the user from the session only (no user id argument), and SHALL return other users' data only via public columns.

#### Scenario: Forged user id
- **WHEN** a client calls the home action with an arbitrary user id in its arguments
- **THEN** the action ignores it and returns only the session user's data

### Requirement: Home is the signed-in navigation target
The dock "Home" item and the command palette "Go home" command SHALL navigate to `/home` when a session exists and to `/` otherwise. When sign-in or onboarding completes without an explicit `redirectTo`, the user SHALL land on `/home`.

#### Scenario: Signed-in user clicks dock Home
- **WHEN** a signed-in user clicks the dock Home icon
- **THEN** they navigate to `/home`

#### Scenario: Sign-in without redirectTo
- **WHEN** a user signs in from `/auth/signin` with no `redirectTo` parameter
- **THEN** they land on `/home`
