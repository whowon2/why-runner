# test-case-visibility Specification

## Purpose
Decide which test cases a viewer may see: per-test `visible` flags on problems, the lesson-level `testVisibility` mode, the single visibility rule shared by exercise cards and failing-test reports, and who bypasses it.
## Requirements
### Requirement: Each test case has its own visibility flag
A problem SHALL store a per-test `visible` flag parallel to its `inputs` and `outputs`. Test *N* (1-based) SHALL be visible when entry *N−1* of `visible` is `true`. A missing entry SHALL count as hidden. On save, the stored array SHALL be normalized to the number of test cases.

#### Scenario: Missing flag counts as hidden
- **WHEN** a problem has 5 test cases and `visible = [true, false]`
- **THEN** test 1 SHALL be visible, and tests 2 through 5 SHALL be hidden

#### Scenario: Save normalizes the array
- **WHEN** an author saves a problem with 3 test cases and `visible = [true]`
- **THEN** the stored `visible` SHALL be `[true, false, false]`

#### Scenario: Existing problems keep their examples
- **WHEN** migration 0050 runs on a problem that had 4 test cases and `exampleCount = 2`
- **THEN** its `visible` SHALL be `[true, true, false, false]`, and the `example_count` column SHALL no longer exist

### Requirement: Authors mark tests as examples in the problem editor
The problem editor SHALL show an "Example (visible to students)" checkbox on every test case. New test cases SHALL start unchecked. This covers both manually added ones and AI-suggested edge cases. Removing a test case SHALL remove its flag along with its input and output. The editor SHALL NOT offer the old "number of examples shown" field.

#### Scenario: Adding a test
- **WHEN** an author clicks "Add input/output"
- **THEN** the new test case's example checkbox SHALL be unchecked

#### Scenario: Marking a later test as an example
- **WHEN** an author checks the example box on test 3 only and saves
- **THEN** the problem's `visible` SHALL be `[false, false, true, …]` and test 3 SHALL be treated as a sample everywhere

#### Scenario: Removing a test keeps flags aligned
- **WHEN** an author removes test 2 of `[true, false, true]`
- **THEN** the remaining flags SHALL be `[true, true]`

### Requirement: Lessons choose a test visibility mode
A lesson SHALL have a `testVisibility` setting with the values `problem_default` (the default), `show_all` and `hide_all`, which applies to every exercise in the lesson:
- `problem_default`: each test follows its problem's `visible` flag.
- `show_all`: every test's input and expected output are visible.
- `hide_all`: every test is hidden.

Migration 0050 SHALL map `showOutputs = true` to `show_all` and `showOutputs = false` to `problem_default`.

#### Scenario: New lesson
- **WHEN** a lesson is created
- **THEN** its `testVisibility` SHALL be `problem_default`

#### Scenario: Migrated lesson that showed outputs
- **WHEN** migration 0050 runs on a lesson with `showOutputs = true`
- **THEN** its `testVisibility` SHALL be `show_all`, and the `show_outputs` column SHALL no longer exist

#### Scenario: Mode applies only inside the lesson
- **WHEN** a problem is used in a `show_all` lesson and a student opens the same problem in practice
- **THEN** practice SHALL follow the problem's own `visible` flags

### Requirement: One rule decides whether a viewer may see a test
A single function SHALL decide, for a viewer and a 1-based test index, whether that test is visible. The exercise "Test cases" card, the failing-test report on every submission view, the practice samples and the Tests tab SHALL all use it. Given the viewer's full access, the problem's `visible` flags and, for lesson exercises, the lesson's `testVisibility`, it SHALL return:
- `true` when the viewer has full access;
- otherwise, the result defined by the lesson mode (practice and contests SHALL behave as `problem_default`).

A visible test SHALL expose its input, its expected output and, in a report, the submission's actual output and stderr. A hidden test SHALL expose only its number (and, in a report, the verdict, the pass counts and any compiler output).

#### Scenario: Same answer for card and report
- **WHEN** a student in a `problem_default` lesson sees test 3 listed on the exercise card
- **THEN** a submission failing test 3 SHALL show test 3's input, expected output and actual output to that student

#### Scenario: Hidden on card, hidden in report
- **WHEN** test 4 is not listed on the exercise card for a student
- **THEN** a submission failing test 4 SHALL show "Test 4 failed (hidden)" with the pass counts, and SHALL NOT show its input, expected output, actual output or stderr

### Requirement: Owners and authors always see every test
For lesson exercises, the problem's author and the class's managers (owner, co-teachers and admins) SHALL see every test's input and expected output on the exercise card, and full reports for any submission, whatever the lesson mode and the `visible` flags. For practice and contests, only the problem's author SHALL have full access.

#### Scenario: Class owner in a hide_all lesson
- **WHEN** the classroom owner opens an exercise in a `hide_all` lesson
- **THEN** the card SHALL list every test case with its input and expected output

#### Scenario: Co-teacher in a hide_all lesson
- **WHEN** a co-teacher of the class opens an exercise in a `hide_all` lesson
- **THEN** the card SHALL list every test case with its input and expected output

#### Scenario: Problem author who does not own the class
- **WHEN** a problem's author is a student in a class that uses their problem in a `hide_all` lesson
- **THEN** they SHALL still see every test case and full reports

### Requirement: Exercise "Test cases" card shows only visible tests
The exercise page SHALL list only the tests the viewer may see, each labelled with its original test number and showing its input and expected output. When some tests are hidden, it SHALL state how many. The server SHALL NOT send hidden tests' inputs or outputs to the client.

#### Scenario: problem_default lesson
- **WHEN** a student opens an exercise whose problem has `visible = [true, false, true, false]` in a `problem_default` lesson
- **THEN** the card SHALL show "Test 1" and "Test 3" with input and expected output, plus a note that 2 test cases are hidden

#### Scenario: show_all lesson
- **WHEN** the lesson is `show_all`
- **THEN** the card SHALL show every test's input and expected output

#### Scenario: hide_all lesson
- **WHEN** the lesson is `hide_all`
- **THEN** the card SHALL show no inputs or outputs, only that all N test cases are hidden

#### Scenario: Direct action call does not leak
- **WHEN** a student calls the get-exercise server action directly for an exercise with hidden tests
- **THEN** the response SHALL NOT contain any hidden test's input or expected output

### Requirement: Lesson owner sets the mode with an immediate control
The lesson settings SHALL show `testVisibility` as a 3-option segmented control, with a short hint for each option. Choosing an option SHALL update the control immediately, before the server responds. On failure it SHALL revert to the previous value and show an error. Saving SHALL refresh only the lesson and the exercise queries.

#### Scenario: Owner switches to show_all
- **WHEN** the lesson owner clicks "Show all"
- **THEN** the control SHALL show "Show all" selected immediately, and the lesson's `testVisibility` SHALL be `show_all` once the request completes

#### Scenario: Server rejects the change
- **WHEN** the update fails (for example, the session expired)
- **THEN** the control SHALL return to the previous option and an error toast SHALL be shown

#### Scenario: Non-owner cannot change it
- **WHEN** a user who does not own the lesson calls `updateLesson` with a `testVisibility` value
- **THEN** the lesson SHALL remain unchanged and the action SHALL fail

