## Purpose

Defines per-contest AI assistance: the creator-set maximum level (`off`/`concept`/`hint`/`pinpoint`), the graduated hint ladder participants climb on failed contest submissions, and server-side enforcement of that level and of submission ownership.

## Requirements

### Requirement: Contest AI assistance level
Each contest SHALL have an AI assistance level, one of `off`, `concept`, `hint`, or `pinpoint`, ordered from least to most revealing. The level SHALL be the maximum level of AI help a participant can get on that contest's submissions. Newly created contests SHALL default to `off`.

#### Scenario: New contest default
- **WHEN** a user creates a new contest
- **THEN** its AI assistance level is `off`

#### Scenario: Level persisted
- **WHEN** the creator sets a contest's AI assistance level to `hint` and saves
- **THEN** reloading the contest shows the level as `hint`

### Requirement: Level semantics
Each enabled level SHALL constrain the AI response as follows:
- `concept`: name only the area or construct at fault (for example "For loop badly implemented"). It SHALL NOT explain the mistake, mention line numbers, or include code.
- `hint`: explain what is wrong in the logic (for example "You forgot to exit the loop"). It SHALL NOT give line numbers or corrected code.
- `pinpoint`: identify the exact location and the fix (for example "Missing a break on line 14"). It MAY reference line numbers and the specific statement to change. It SHALL NOT return a complete rewritten solution.

#### Scenario: Concept response
- **WHEN** a participant requests the `concept` hint for a failed submission whose loop never terminates
- **THEN** the response names the faulty construct (for example the loop) without explaining the fix or citing a line number

#### Scenario: Pinpoint response
- **WHEN** a participant requests the `pinpoint` hint for the same submission
- **THEN** the response names the line and the missing or wrong statement

### Requirement: Graduated hint ladder
On a failed contest submission, AI help SHALL be revealed one level at a time, starting at `concept`. After a level is shown, the participant SHALL be able to request the next level, until reaching the contest's maximum level. Hints already revealed for a submission SHALL stay visible together, in order, when the help dialog is reopened.

#### Scenario: Stepping up the ladder
- **WHEN** a contest's level is `pinpoint` and a participant opens AI help on a failed submission
- **THEN** they can request the `concept` hint first
- **AND** after it is shown, they can request `hint`, and after that, `pinpoint`

#### Scenario: Ladder capped at contest maximum
- **WHEN** a contest's level is `hint` and a participant has already revealed `concept` and `hint` for a submission
- **THEN** no option to request a further level is shown

#### Scenario: Passed submission
- **WHEN** a participant opens AI help on a passed submission in a contest whose level is not `off`
- **THEN** they can request a single optimization-focused response, with no further hint levels offered

#### Scenario: Reopening the dialog
- **WHEN** a participant has revealed `concept` and `hint` for a submission and reopens its AI help dialog
- **THEN** both hints are shown, in order, without new AI requests

### Requirement: AI help disabled when level is off
When a contest's AI assistance level is `off`, the AI help control SHALL NOT be rendered on that contest's submissions.

#### Scenario: Off contest
- **WHEN** a participant views their submissions in a contest whose level is `off`
- **THEN** no AI help button is shown on any submission row

### Requirement: Server-side enforcement
The AI help server action SHALL take a submission id and a requested level. It SHALL load the submission and its problem from the database, and SHALL reject the request if the submission doesn't belong to the current user. If the submission belongs to a contest, the action SHALL reject a requested level above the contest's current maximum, and SHALL reject every request when that maximum is `off`. The level is read when the request is made, so a change by the creator takes effect immediately.

#### Scenario: Request bypassing the UI on an off contest
- **WHEN** a client calls the AI help action directly for a submission in a contest whose level is `off`
- **THEN** the action returns an error and makes no AI request

#### Scenario: Request above the maximum
- **WHEN** a client requests `pinpoint` for a submission in a contest whose level is `concept`
- **THEN** the action returns an error and makes no AI request

#### Scenario: Someone else's submission
- **WHEN** a user requests AI help for a submission they did not make
- **THEN** the action returns an error and makes no AI request

#### Scenario: Creator lowers the level mid-contest
- **WHEN** the creator changes the level from `pinpoint` to `off` while a contest is running
- **THEN** participants' next AI help requests on that contest are refused

### Requirement: Non-contest AI help unchanged
AI help on submissions that are not part of a contest (for example class exercises) SHALL keep its current single-response behaviour and SHALL NOT be affected by any contest's level.

#### Scenario: Class exercise
- **WHEN** a student requests AI help on a class exercise submission
- **THEN** they get a single help response, as before this change
