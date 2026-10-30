## MODIFIED Requirements

### Requirement: Exercise page shows declared test-case inputs
The exercise page SHALL display, before the student submits, the test cases that the viewer may see under the lesson's `testVisibility` (per the test-case-visibility capability), each with its input and expected output, so students can see the edge cases the problem is graded against without hidden tests being revealed.

#### Scenario: Student views an exercise
- **WHEN** a student opens an exercise page in a `problem_default` lesson
- **THEN** the system SHALL display the input and expected output of each test marked visible on the problem, and the number of hidden tests

#### Scenario: Student views an exercise in a show_all lesson
- **WHEN** a student opens an exercise page in a `show_all` lesson
- **THEN** the system SHALL display every test case's input and expected output

## REMOVED Requirements

### Requirement: Lesson-level toggle controls test-case output visibility
**Reason**: The `showOutputs` boolean only toggled expected outputs, and it left every input public. It is replaced by the lesson `testVisibility` mode (`problem_default`, `show_all`, `hide_all`) in the test-case-visibility capability.
**Migration**: Migration 0050 maps `showOutputs = true` to `show_all` and `false` to `problem_default`. The lesson settings switch becomes a 3-option segmented control.
