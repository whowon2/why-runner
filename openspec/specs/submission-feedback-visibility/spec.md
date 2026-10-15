# submission-feedback-visibility Specification

## Purpose
Which parts of a judge report (failing test input, expected output, actual output, stderr) each viewer may see, so hidden test cases stay secret: problem owners see everything, sample-test and compile failures are shown in full, hidden-test failures show only the verdict, and lesson exercises follow the lesson's output-visibility toggle.
## Requirements
### Requirement: Judge reports are redacted for the viewer on read
The judge SHALL keep writing the full report (failing test input, expected output, actual output, stderr) to `submission.output`. Every server action that returns submission output to a client SHALL pass it through a single redaction function, which applies the visibility rules in this capability. This covers practice, contest, lesson exercise, profile submission lists, and the contest export. The unredacted report SHALL never be sent to a viewer who is not allowed to see it.

#### Scenario: Raw output never leaves the server unredacted
- **WHEN** any submission-reading action returns a submission whose failure is on a hidden test
- **THEN** the returned `output` SHALL already be redacted, and calling the action directly (bypassing the UI) SHALL NOT reveal the hidden data

### Requirement: Problem owner sees full reports
The creator of a problem SHALL see the full judge report for any submission to that problem.

#### Scenario: Owner inspects a failing hidden test
- **WHEN** a problem's creator views a submission that failed hidden test 7
- **THEN** they SHALL see test 7's input, expected output, actual output, and error

### Requirement: Hidden test failures show only the verdict in practice and contests
For practice and contest submissions viewed by anyone other than the problem's creator, the rule depends on the failing test:
- A failure on a sample test (index ≤ `exampleCount`) SHALL show the full detail.
- A failure on a hidden test SHALL show only the verdict kind (wrong answer, runtime error, time limit, constraint violation), the test number, and the passed/total counts. It SHALL NOT include the input, the expected output, the actual output, or stderr.

Compile errors SHALL always show the compiler output, since it does not depend on test input.

This applies to the contest owner too, unless they also created the problem.

#### Scenario: Wrong answer on a sample
- **WHEN** a student's practice submission fails test 1 and the problem has `exampleCount = 2`
- **THEN** the student SHALL see test 1's input, expected output, and their output

#### Scenario: Wrong answer on a hidden test
- **WHEN** a student's contest submission fails test 5 and the problem has `exampleCount = 2`
- **THEN** the student SHALL see "Wrong answer on test 5" and the passed count, and SHALL NOT see the input, expected output, their actual output, or stderr

#### Scenario: Runtime error on a hidden test does not leak via stderr
- **WHEN** a student's code prints the test input to stderr and then crashes on hidden test 4
- **THEN** the student SHALL see "Runtime error on test 4" without stderr

#### Scenario: Compile error
- **WHEN** a submission fails to compile
- **THEN** the student SHALL see the compiler output

#### Scenario: Contest owner who does not own the problem
- **WHEN** a contest owner views a participant's submission to a problem created by someone else
- **THEN** a failure on a hidden test SHALL be redacted for them as for a student

### Requirement: Lesson exercise reports follow the lesson's output visibility
For lesson exercise submissions, the rule depends on the lesson's `showOutputs` setting:
- The failing test's input, actual output, and error SHALL be visible to the student, since exercise inputs are already shown on the exercise page.
- The expected output SHALL be visible only when the lesson's `showOutputs` is on.

The lesson owner SHALL see the full report.

#### Scenario: Outputs hidden in the lesson
- **WHEN** a student views a failing exercise submission in a lesson with `showOutputs` off
- **THEN** they SHALL see the input and their output, and the expected output SHALL be absent

#### Scenario: Outputs shown in the lesson
- **WHEN** the lesson has `showOutputs` on
- **THEN** the student SHALL also see the expected output

### Requirement: Contest export applies the same redaction
The contest export's "Judge Output" column SHALL be redacted with the contest owner as the viewer.

#### Scenario: Export by a contest owner who did not write the problems
- **WHEN** a contest owner exports a contest that uses another author's problems
- **THEN** hidden-test failures in `submissions.csv` SHALL appear as verdict and test number only

