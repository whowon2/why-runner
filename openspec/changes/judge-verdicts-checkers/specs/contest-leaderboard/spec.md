## MODIFIED Requirements

### Requirement: Standings are derived from contest submissions
The leaderboard SHALL compute each accepted participant's results from the `submission` rows of that contest (`submission.contestId` = contest id), matched to contest problems by `problemId`. Only submissions created at or after the contest `startDate` (when set) and at or before the contest `endDate` (when set) SHALL count. For each participant and problem, the system SHALL determine:
- **solved**: whether any counting submission has status `PASSED`;
- **solve time**: whole minutes from `startDate` to the earliest `PASSED` submission (0 when `startDate` is unset);
- **rejected attempts**: the number of counting submissions with status `WRONG_ANSWER`, `TIME_LIMIT_EXCEEDED`, `MEMORY_LIMIT_EXCEEDED`, `RUNTIME_ERROR`, `FAILED` (legacy) or `CONSTRAINT_VIOLATION` created before the earliest `PASSED` one (or all of them, if unsolved);
- **pending**: whether any counting submission has status `PENDING`, `RUNNING`, or `PENDING_CONSTRAINT_CLASSIFICATION` and the problem is not yet solved.

Submissions with status `ERROR` or `COMPILATION_ERROR` SHALL NOT count as rejected attempts.

#### Scenario: Solved after two wrong attempts
- **WHEN** a participant submits problem B with results WRONG_ANSWER, TIME_LIMIT_EXCEEDED, PASSED (in that order) during the contest
- **THEN** problem B is solved for them with 2 rejected attempts and a solve time equal to the minutes between contest start and the PASSED submission

#### Scenario: Legacy FAILED still counts
- **WHEN** a participant has a submission with the legacy status `FAILED` before their `PASSED` one
- **THEN** it counts as 1 rejected attempt

#### Scenario: Constraint violation counts as a rejection, not a solve
- **WHEN** a participant's only submission for a problem ends with status `CONSTRAINT_VIOLATION`
- **THEN** the problem is not solved for them and shows 1 rejected attempt

#### Scenario: Judge error is not penalised
- **WHEN** a participant's submission for a problem ends with status `ERROR`
- **THEN** it does not add a rejected attempt

#### Scenario: Compilation error is not penalised
- **WHEN** a participant's submission for a problem ends with status `COMPILATION_ERROR`
- **THEN** it does not add a rejected attempt

#### Scenario: Submission after the contest ends
- **WHEN** a participant gets `PASSED` on a problem with a submission created after the contest `endDate`
- **THEN** the leaderboard does not count that problem as solved

#### Scenario: Submission still being judged
- **WHEN** a participant's latest submission for an unsolved problem has status `PENDING`
- **THEN** that problem is marked pending for them
