## MODIFIED Requirements

### Requirement: Latest verdict next to the submit button
Every submission editor (lesson exercise in code, blocks and parsons modes; problem Submit tab; contest problem editor) SHALL show, next to its submit button, the current user's newest submission for that target: its status as a `StatusBadge` and, once judged with a report, the passed and total test counts. Nothing SHALL be shown when the user has no submission for the target. While the newest submission is `PENDING` or `RUNNING`, its list SHALL be refreshed on the `judge-result-polling` schedule, and once that schedule stops the verdict SHALL show the "still judging" state with a Check again action.

#### Scenario: Verdict appears after submitting
- **WHEN** a student submits on an exercise and the judge returns a wrong answer that passed 3 of 5 tests
- **THEN** the editor toolbar shows the wrong-answer badge and `3/5` within a few seconds, without scrolling

#### Scenario: No submission yet
- **WHEN** a student opens a problem they never submitted
- **THEN** no verdict is shown in the toolbar

#### Scenario: Fullscreen
- **WHEN** the editor is in fullscreen and a submission finishes judging
- **THEN** the verdict is visible in the fullscreen toolbar

#### Scenario: Stuck submission
- **WHEN** the newest submission has been `PENDING` for 5 minutes
- **THEN** the toolbar shows "still judging" with Check again, and the list is no longer refetched on an interval
