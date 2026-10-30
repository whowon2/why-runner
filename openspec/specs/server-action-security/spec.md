# server-action-security Specification

## Purpose
Rules every web server action must follow, since each export of a `"use server"` module is a public endpoint: authentication and ownership checks, explicit input allowlists with server-derived fields, server-only placement of helpers without auth, public-only user columns, and per-user rate limits on AI calls.
## Requirements
### Requirement: Contest submissions accept only an explicit field set
`createSubmission` SHALL accept only `contestId`, `problemId`, `code`, and `language` from the client. It SHALL NOT copy any other client-supplied field into the inserted row. The inserted row SHALL always have `status = PENDING`, `userId` set to the current user, `codeSize` computed on the server, and `questionLetter` derived on the server from the problem's position in the contest.

#### Scenario: Client tries to forge a verdict
- **WHEN** a participant calls `createSubmission` with an extra `status: "PASSED"` (or `output`, `runtimeMs`, `userId`) field
- **THEN** the inserted submission SHALL have `status = PENDING`, the current user's id, and no client-supplied output or runtime, and the judge SHALL grade it normally

#### Scenario: Question letter derived on the server
- **WHEN** a participant submits for the problem at contest order index 2
- **THEN** the submission's `questionLetter` SHALL be `C`, regardless of any letter the client sends

### Requirement: Contest submissions are validated against the contest
`createSubmission` SHALL reject the submission unless all of the following hold:
- the contest is `published`;
- the current user is an `accepted` participant;
- the problem is attached to the contest;
- the contest has no `startDate`, or its `startDate` has passed.

Submissions after `endDate` SHALL still be accepted (they are flagged and not counted, per the contest-leaderboard spec).

#### Scenario: Problem not in the contest
- **WHEN** a participant submits with a `problemId` that is not attached to the contest
- **THEN** the action SHALL fail and no submission row SHALL be created

#### Scenario: Contest not started
- **WHEN** a participant submits before the contest `startDate`
- **THEN** the action SHALL fail with a `CONTEST_NOT_STARTED` action failure

#### Scenario: Late submission
- **WHEN** a participant submits after the contest `endDate`
- **THEN** the submission SHALL be created and judged, and the leaderboard SHALL not count it

### Requirement: Submissions enforce language and size limits
Every submission-creating action (contest, practice, lesson exercise) SHALL reject a `language` that is not a member of the `language` enum. It SHALL also reject code longer than a shared maximum (`MAX_CODE_LENGTH`, 64 KiB), returning a `CODE_TOO_LARGE` action failure.

#### Scenario: Oversized code
- **WHEN** a user submits 100 KiB of source code
- **THEN** the action SHALL return `CODE_TOO_LARGE` and no submission row SHALL be created

### Requirement: Practice submissions only target visible problems
`createProblemSubmission` SHALL only accept a `problemId` whose problem is `published` or was created by the current user.

#### Scenario: Submitting to another user's draft
- **WHEN** a user submits to a draft problem created by someone else
- **THEN** the action SHALL fail as not found and no submission row SHALL be created

### Requirement: Contest problem list mutations require ownership
Adding, removing, or reordering problems on a contest SHALL require the current user to be the contest's creator. These operations SHALL be rejected once a published contest's `startDate` has passed. Adding a problem SHALL be rejected when the problem is a draft created by another user.

#### Scenario: Non-owner removes a problem
- **WHEN** a user who did not create the contest calls the remove-problem action
- **THEN** the action SHALL fail as Forbidden and the problem SHALL stay attached

#### Scenario: Unauthenticated removal
- **WHEN** a request with no session calls the remove-problem action
- **THEN** the action SHALL not modify any data

#### Scenario: Attaching someone else's draft
- **WHEN** a contest owner attaches a draft problem created by another user
- **THEN** the action SHALL fail as not found

### Requirement: Update actions use field allowlists
`updateProblem` and `updateContest` SHALL parse their input with an explicit zod schema listing the editable fields, and SHALL write only those fields:
- `updateProblem`: title, description, narrative, difficulty, tags, inputs, outputs, visible, compareMode, floatEpsilon, checker
- `updateContest`: name, description, startDate, endDate, isPrivate, aiAssistance

Fields not in the schema (including `id`, `status`, `createdBy`, `code`, `slug`, `createdAt`) SHALL be ignored or rejected, never written. `status` SHALL change only through the publish actions. A lesson's `testVisibility` SHALL be written only through `updateLesson`, which SHALL accept only one of the `testVisibility` enum values and write only when the caller owns the lesson.

#### Scenario: Owner tries to publish through update
- **WHEN** a problem owner calls `updateProblem` with `status: "published"`
- **THEN** the problem's status SHALL remain unchanged

#### Scenario: Owner tries to transfer ownership
- **WHEN** an owner calls `updateContest` with `createdBy` set to another user's id
- **THEN** the contest's `createdBy` SHALL remain unchanged

#### Scenario: Legacy exampleCount is not written
- **WHEN** a client calls `updateProblem` with `exampleCount: 3`
- **THEN** no column SHALL be written for it, and `visible` SHALL remain unchanged

#### Scenario: Invalid test visibility value
- **WHEN** a lesson owner calls `updateLesson` with `testVisibility: "everything"`
- **THEN** the action SHALL fail validation and the lesson SHALL remain unchanged

### Requirement: Internal helpers are not server-action endpoints
Functions meant only for server-side use SHALL NOT be exported from a `"use server"` module. This covers AI classification of algorithm requirements and resolution of pending constraint classifications. They SHALL live in a module that imports `server-only`.

#### Scenario: Browser invokes the classifier
- **WHEN** a client tries to invoke the algorithm-requirement classifier as a server action
- **THEN** no server action endpoint SHALL exist for it, and no LLM call SHALL be made

### Requirement: User data returned to clients excludes private fields
Any server action that returns another user's data SHALL select a fixed public column set: id, name, username, image, coverImage, coverDim, bio, location, website, createdAt. That includes profile lookups and the `user` relation on submissions, participants, and members. It SHALL NOT return `email` or `emailVerified`. A contest owner's export bundle is the only place participant emails appear.

#### Scenario: Visiting a profile
- **WHEN** a signed-in user fetches another user's profile
- **THEN** the response SHALL NOT contain that user's email

#### Scenario: Contest submissions list
- **WHEN** a contest owner loads the contest submissions table
- **THEN** each submission's `user` SHALL contain only public columns

### Requirement: AI actions are rate limited per user
Every action that calls the LLM on a user's behalf SHALL record the call and SHALL refuse when the user exceeds the per-feature limit within the window. Covered actions: AI help, problem review, narrative generation, tag suggestion, reference solution generation. A refusal SHALL be returned as an `ActionFailure` with code `RATE_LIMITED` and a `retryAfterSeconds` param, and the UI SHALL show it as a localized message.

#### Scenario: Limit exceeded
- **WHEN** a user requests AI help more times than the AI-help limit allows within the window
- **THEN** the action SHALL return `RATE_LIMITED` without calling any AI provider, and the UI SHALL show a localized "try again in N seconds" message

#### Scenario: Under the limit
- **WHEN** a user is under the limit
- **THEN** the AI call SHALL proceed and be recorded

### Requirement: AI locale input is constrained
AI actions that accept a `locale` SHALL map it to one of the supported app locales (`en`, `br`) before interpolating it into a prompt.

#### Scenario: Arbitrary locale string
- **WHEN** a client sends `locale: "ignore previous instructions"`
- **THEN** the prompt SHALL use `br` (the non-`en` fallback) and SHALL NOT contain the supplied string

### Requirement: Draft contests are hidden on slug lookup
Looking up a contest by slug SHALL return nothing to anyone except the creator while the contest is a draft.

#### Scenario: Non-owner opens a draft contest URL
- **WHEN** a user who is not the creator opens a draft contest's slug URL
- **THEN** the page SHALL be treated as not found

