# user-identity Specification

## Purpose
Defines who a user is in WhyRunner: the username (format, stored case, case-insensitive uniqueness), the optional IFMG RA (format, storage, uniqueness, who can see it), what email signup and social login collect or generate, and the migration that backfilled RAs typed as usernames during the 2026-10-29 classroom test.
## Requirements
### Requirement: Username format preserves case
A `username` SHALL be 3–20 characters drawn from `A-Z`, `a-z`, `0-9`, `.` and `-`. The system SHALL store the username exactly as the user typed it, without changing its case, and SHALL display it with that case.

#### Scenario: Mixed-case username kept
- **WHEN** a user signs up or saves their profile with username `AnaSilva`
- **THEN** the stored and displayed username is `AnaSilva`

#### Scenario: Invalid characters rejected
- **WHEN** a user submits username `ana_silva` or `ana silva`
- **THEN** the submission is rejected with a username format error and nothing is persisted

### Requirement: Username uniqueness ignores case
No two users SHALL have usernames that are equal when compared case-insensitively. The database SHALL enforce this with a unique index on `lower(username)`. Every application-level duplicate check SHALL compare case-insensitively and SHALL exclude the user's own row when that user is editing their own profile.

#### Scenario: Case variant of an existing username
- **WHEN** user `ana` exists and someone signs up with or saves username `Ana`
- **THEN** the request is rejected with a "username already taken" error

#### Scenario: Changing only the case of one's own username
- **WHEN** the user whose username is `ana` saves their profile with username `Ana`
- **THEN** the change is accepted and the stored username becomes `Ana`

#### Scenario: Concurrent duplicate signups
- **WHEN** two signups with usernames `Bob` and `bob` pass the application check at the same time
- **THEN** the database index rejects one of them, so no duplicate is stored (on signup that user gets the generic sign-up failure; on a profile save, "username already taken")

### Requirement: Users have an optional RA
Every user SHALL have an optional `ra` (Registro do Aluno, the IFMG student ID), stored as text so leading zeros are never lost. When present, it SHALL consist of exactly 7 digits. It SHALL be unique across users, and any number of users MAY have no RA. Surrounding whitespace SHALL be trimmed, and an empty value SHALL be stored as null.

#### Scenario: RA with leading zeros
- **WHEN** a user saves RA `0064019`
- **THEN** the stored value is the text `0064019`, not `64019`

#### Scenario: Wrong RA format
- **WHEN** a user submits RA `64019`, `00640190` or `00a4019`
- **THEN** the submission is rejected with an RA format error and nothing is persisted

#### Scenario: Duplicate RA
- **WHEN** a user submits an RA that another user already has
- **THEN** the submission is rejected with an "RA already registered" error

#### Scenario: RA left empty
- **WHEN** a user submits an empty RA
- **THEN** the user's `ra` is null, and other users with a null RA do not conflict with it

### Requirement: RA is visible only to the user and their class owners
A user's `ra` SHALL NOT be part of the public user columns. It SHALL be returned only to the user themselves (their own profile edit form) and to the owner of a class the user is a student in (roster, gradebook, class exports). It SHALL NOT appear on public profiles, in contest data, or for other class members.

#### Scenario: Another student views the class
- **WHEN** a class member who is not the owner loads the class
- **THEN** no student's RA is returned

#### Scenario: Visitor views a profile
- **WHEN** any user views another user's profile page
- **THEN** the profile data sent to the client contains no `ra`

### Requirement: Class roster shows students' RA to the owner
The class page's student roster, shown only to the class owner, SHALL display each student's RA next to their name. A student without an RA SHALL show no RA, without an error.

#### Scenario: Owner views roster
- **WHEN** the owner of a class opens the class page and a student has RA `0064019`
- **THEN** that student's roster entry shows `0064019`

### Requirement: Email signup collects username and optional RA
The email signup form SHALL collect name, username, email, password and an optional RA. The client SHALL validate username and RA format before submitting. The server SHALL validate both formats again and check uniqueness before creating the user. A server rejection SHALL be shown on the matching field. On success, the user SHALL go directly to the `redirectTo` destination (default `/home`) with no intermediate step.

#### Scenario: Successful email signup
- **WHEN** a visitor signs up with name, a free username `JoaoP`, email, password and RA `0064019`
- **THEN** the account is created with username `JoaoP` and RA `0064019`, and the user lands on `/home`

#### Scenario: Username taken at signup
- **WHEN** a visitor signs up with a username that matches an existing one case-insensitively
- **THEN** no account is created and the username field shows "username already taken"

#### Scenario: Signup without RA
- **WHEN** a visitor signs up and leaves RA empty
- **THEN** the account is created with a null RA

### Requirement: Social login gets a generated username
A user created through GitHub or Google login SHALL be given a unique generated username (from the email local part plus a random suffix) and a null RA, and SHALL go directly to the `redirectTo` destination (default `/home`). They SHALL be able to change the username and set an RA later in the profile edit form.

#### Scenario: First GitHub login
- **WHEN** a new user signs in with GitHub
- **THEN** an account is created with a generated username, and the user lands on their `redirectTo` destination without any onboarding page

### Requirement: Identity fields cannot bypass validation
Username and RA SHALL be changeable only through signup and the `updateProfile` action, both of which validate them. Better Auth's generic user-update endpoint SHALL reject requests that try to set `username` or `ra`.

#### Scenario: Direct auth-client update
- **WHEN** a signed-in client calls the auth library's update-user endpoint with a `username` or `ra` field
- **THEN** the request is rejected and the stored values are unchanged

### Requirement: RA-shaped usernames are backfilled into RA
The migration that introduces `ra` SHALL copy `username` into `ra` for every user whose username matches `^\d{7}$` and whose `ra` is null. It SHALL keep their username unchanged.

#### Scenario: Student from the classroom test
- **WHEN** the migration runs and a user has username `0064019` and no RA
- **THEN** afterwards that user has RA `0064019` and username `0064019`

#### Scenario: Non-RA username
- **WHEN** the migration runs and a user has username `ana` or `12345678`
- **THEN** that user's RA stays null

