# editor-latest-verdict Specification

## Purpose
TBD - created by archiving change survey-feedback-fixes. Update Purpose after archive.
## Requirements
### Requirement: Latest verdict next to the submit button
Every submission editor (lesson exercise in code, blocks and parsons modes; problem Submit tab; contest problem editor) SHALL show, next to its submit button, the current user's newest submission for that target: its status as a `StatusBadge` and, once judged with a report, the passed and total test counts. Nothing SHALL be shown when the user has no submission for the target. While the newest submission is `PENDING` or `RUNNING`, its list SHALL be refreshed at least every 2 seconds.

#### Scenario: Verdict appears after submitting
- **WHEN** a student submits on an exercise and the judge returns a wrong answer that passed 3 of 5 tests
- **THEN** the editor toolbar shows the wrong-answer badge and `3/5` within a few seconds, without scrolling

#### Scenario: No submission yet
- **WHEN** a student opens a problem they never submitted
- **THEN** no verdict is shown in the toolbar

#### Scenario: Fullscreen
- **WHEN** the editor is in fullscreen and a submission finishes judging
- **THEN** the verdict is visible in the fullscreen toolbar

### Requirement: Verdict opens the full submission details
Activating the verdict SHALL open a dialog with the newest submission's full report, as redacted for the viewer (the same content as the submission list's details), above any fullscreen editor.

#### Scenario: Open details from the toolbar
- **WHEN** a student clicks the verdict of a submission that failed a visible test
- **THEN** a dialog shows the failing test number, the input, their output, the expected output and any stderr

#### Scenario: Hidden test
- **WHEN** the newest submission failed a hidden test
- **THEN** the dialog shows only the hidden-test notice

