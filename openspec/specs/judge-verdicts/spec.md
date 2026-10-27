# judge-verdicts Specification

## Purpose
Defines the final verdicts a graded submission can get (wrong answer, time limit, memory limit, compilation error, runtime error, judge error), how the judge picks one, and how they are labelled and treated in the web UI.

## Requirements
### Requirement: Distinct final verdicts
The `submission_status` enum SHALL include the final verdicts `WRONG_ANSWER`, `TIME_LIMIT_EXCEEDED`, `MEMORY_LIMIT_EXCEEDED`, `COMPILATION_ERROR` and `RUNTIME_ERROR`, in addition to the existing labels. The judge's Rust enum and the web's Drizzle enum SHALL list the same labels. `FAILED` SHALL remain a valid label for existing rows but the judge SHALL NOT write it for newly graded submissions. `ERROR` SHALL be reserved for judge-side faults (dead-lettered submissions, sandbox failures, checker failures).

#### Scenario: Historical rows stay valid
- **WHEN** the migration is applied to a database containing submissions with status `FAILED` or `ERROR`
- **THEN** those rows keep their status and still render in every submission view

#### Scenario: New failing submission never gets FAILED
- **WHEN** the judge grades a new submission that does not pass
- **THEN** its status is one of `WRONG_ANSWER`, `TIME_LIMIT_EXCEEDED`, `MEMORY_LIMIT_EXCEEDED`, `COMPILATION_ERROR`, `RUNTIME_ERROR` or `ERROR`

### Requirement: Verdict selection
The judge SHALL set a failing submission's status to the verdict of the first failing test case (or `COMPILATION_ERROR` when compilation fails), and SHALL record that verdict in the JSON report's `verdict` field (`PASSED` when all tests pass). Per test case: a sandbox failure SHALL yield `ERROR`; exceeding the time limit `TIME_LIMIT_EXCEEDED`; a failed run attributable to memory exhaustion `MEMORY_LIMIT_EXCEEDED`; any other non-zero exit or fatal signal `RUNTIME_ERROR`; a successful run whose output does not match under the problem's comparison mode `WRONG_ANSWER`. Solution-constraint handling for submissions that pass all tests SHALL be unchanged.

#### Scenario: Wrong output
- **WHEN** a submission runs successfully but prints a different answer on test 2
- **THEN** the submission status is `WRONG_ANSWER` and the report's `verdict` is `WRONG_ANSWER` with failure details for test 2

#### Scenario: Timeout
- **WHEN** a submission exceeds the problem's time limit on a test case
- **THEN** the submission status is `TIME_LIMIT_EXCEEDED`

#### Scenario: Memory exhaustion
- **WHEN** a Python submission allocates far beyond its box memory limit and dies with `MemoryError`
- **THEN** the submission status is `MEMORY_LIMIT_EXCEEDED`

#### Scenario: Crash
- **WHEN** a submission exits with a non-zero code for a reason unrelated to memory
- **THEN** the submission status is `RUNTIME_ERROR`

#### Scenario: Compile failure
- **WHEN** a C++ submission fails to compile
- **THEN** the submission status is `COMPILATION_ERROR` and the report keeps the compiler output

#### Scenario: Exercise run_all keeps first failure's verdict
- **WHEN** a lesson-exercise submission gets `WRONG_ANSWER` on test 1 and `TIME_LIMIT_EXCEEDED` on test 3
- **THEN** the status is `WRONG_ANSWER` and `passed_count` still counts every passing test

### Requirement: Verdict display
Every web view that shows a submission's status SHALL show a localized label (pt and en) and a distinct colour per verdict, including the legacy `FAILED` and `ERROR`. Views that offer actions for finished failing submissions (AI help, failure notifications, exercise detail failure info) SHALL treat all new verdicts as finished failures.

#### Scenario: Localized badge
- **WHEN** a Portuguese-locale student views a submission with status `TIME_LIMIT_EXCEEDED`
- **THEN** the status shows the Portuguese label for time limit exceeded, not the raw enum text

#### Scenario: AI help available for new verdicts
- **WHEN** a contest allows AI assistance and a participant's submission ended in `RUNTIME_ERROR`
- **THEN** the AI help button is offered for that submission, as it was for `FAILED`

#### Scenario: Failure notification
- **WHEN** a submission is graded `WRONG_ANSWER`
- **THEN** the notification uses the failed-submission message

