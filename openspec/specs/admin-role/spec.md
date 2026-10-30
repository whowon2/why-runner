# admin-role Specification

## Purpose
Platform-wide `admin` role on `user.role`: admins manage every contest, class, lesson and problem, see survey results, and use the `/admin` hub to browse all contests and classes and promote or demote other admins. Replaces the `SURVEY_ADMIN_EMAILS` runtime gate.
## Requirements
### Requirement: User role column
Every user SHALL have a `role` of `user` or `admin`, defaulting to `user`. The role SHALL NOT be settable through sign-up, profile update or any client input other than the admin users page.

#### Scenario: New sign-up
- **WHEN** a person signs up by email or OAuth
- **THEN** their user row has `role = 'user'`

#### Scenario: Client tries to set role on sign-up
- **WHEN** a sign-up request includes `role: "admin"`
- **THEN** the created user still has `role = 'user'`

### Requirement: Admin authorization reads current role
Every admin check SHALL read the user's role from the database for the current request, not from the cached session, so a demotion takes effect on the next request.

#### Scenario: Demoted admin
- **WHEN** an admin is demoted and then, within the session cache window, calls an admin-only action
- **THEN** the action is rejected

### Requirement: Seed admins from SURVEY_ADMIN_EMAILS
The system SHALL provide a script that promotes to `admin` every existing user whose email (trimmed, case-insensitive) is in the comma-separated `SURVEY_ADMIN_EMAILS`. The script SHALL be idempotent, SHALL NOT demote anyone, and SHALL report which emails were promoted and which matched no user.

#### Scenario: Seeding
- **WHEN** `SURVEY_ADMIN_EMAILS="A@x.com, b@y.com"` and only `a@x.com` exists
- **THEN** `a@x.com` becomes admin and the script reports `b@y.com` as not found

#### Scenario: Rerun
- **WHEN** the script runs twice
- **THEN** the second run changes nothing and reports no error

### Requirement: Admins manage all classes, lessons, contests and problems
An admin SHALL pass every ownership or class-management check for any class, lesson, exercise, contest and problem, including view, edit, publish, delete, review, gradebook, export, similarity and member removal. Lifecycle rules that also bind owners (e.g. no problem-list edits after a contest starts, unpublish before deleting a lesson) SHALL still apply to admins.

#### Scenario: Admin deletes someone else's class
- **WHEN** an admin who is not a member deletes a class
- **THEN** the class and its dependent rows are deleted

#### Scenario: Admin opens a draft contest
- **WHEN** an admin opens another user's draft contest URL
- **THEN** the contest page renders with owner controls

#### Scenario: Admin edits a started contest's problem list
- **WHEN** an admin removes a problem from a published contest whose start date has passed
- **THEN** the action fails with the same error an owner would get

#### Scenario: Admin edits another user's draft problem
- **WHEN** an admin updates a draft problem created by another user
- **THEN** the update succeeds

### Requirement: Admin area
The system SHALL provide `/admin`, `/admin/contests`, `/admin/classes` and `/admin/users`, available only to admins; anyone else SHALL get not found. Every admin action SHALL verify the caller is an admin independently of the page. `/admin` SHALL link to all contests, all classes, survey results and users. The pages SHALL use the shared page header with a title and subtitle in both locales and the standard `max-w-5xl` container.

#### Scenario: Regular user opens /admin
- **WHEN** a non-admin opens `/admin/users`
- **THEN** the page is treated as not found

#### Scenario: Regular user calls an admin action directly
- **WHEN** a non-admin calls `setUserRole`
- **THEN** the action is rejected and no row changes

#### Scenario: Admin hub
- **WHEN** an admin opens `/admin`
- **THEN** it shows links to all contests, all classes, survey results and users

### Requirement: Admin lists of contests and classes
`/admin/contests` SHALL list every contest, drafts included, with title, owner, status and dates, each linking to the contest page. `/admin/classes` SHALL list every class with name, owner, student count and lesson count, each linking to the class page. Both SHALL be searchable by name and paginated.

#### Scenario: Draft contest listed
- **WHEN** another user has a draft contest
- **THEN** it appears on `/admin/contests` with status draft

### Requirement: Promote and demote admins
`/admin/users` SHALL list users searchable by name, username or email, show each one's role, and let an admin promote a user to admin or demote an admin to user. An admin SHALL NOT be able to demote themself.

#### Scenario: Promote
- **WHEN** an admin promotes a user
- **THEN** that user's role becomes `admin` and they can open `/admin` on their next request

#### Scenario: Self-demotion
- **WHEN** an admin tries to demote themself
- **THEN** the action is rejected and their role stays `admin`

### Requirement: Admin entry point
The avatar menu and the command palette SHALL show an "Admin" entry linking to `/admin` for admins only.

#### Scenario: Regular user menu
- **WHEN** a non-admin opens the avatar menu
- **THEN** no Admin entry is shown

