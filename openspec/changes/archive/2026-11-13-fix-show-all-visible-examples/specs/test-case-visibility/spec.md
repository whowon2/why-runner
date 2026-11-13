## MODIFIED Requirements

### Requirement: Authors mark tests as examples in the problem editor
The problem editor SHALL show an "Example (visible to students)" checkbox on every test case. New test cases SHALL start unchecked. This covers both manually added ones and AI-suggested edge cases. Removing a test case SHALL remove its flag along with its input and output. The editor SHALL NOT offer the old "number of examples shown" field. Each test case SHALL show its current state next to its label ("Visible to students" or "Hidden"), and the test list SHALL state how many of its tests are visible to students.

#### Scenario: Adding a test
- **WHEN** an author clicks "Add input/output"
- **THEN** the new test case's example checkbox SHALL be unchecked and the test SHALL be labelled "Hidden"

#### Scenario: Marking a later test as an example
- **WHEN** an author checks the example box on test 3 only and saves
- **THEN** the problem's `visible` SHALL be `[false, false, true, …]` and test 3 SHALL be treated as a sample everywhere

#### Scenario: Removing a test keeps flags aligned
- **WHEN** an author removes test 2 of `[true, false, true]`
- **THEN** the remaining flags SHALL be `[true, true]`

#### Scenario: State is visible at a glance
- **WHEN** an author edits a problem with 3 tests of which tests 1 and 3 are checked
- **THEN** tests 1 and 3 SHALL be labelled "Visible to students", test 2 SHALL be labelled "Hidden", and the list SHALL say 2 of 3 tests are visible to students

## ADDED Requirements

### Requirement: Statement examples list every visible test
The examples under a problem statement (standalone problem, contest problem and lesson exercise) SHALL list every test the viewer may see, in test order, with no cap on how many.

#### Scenario: Three visible tests
- **WHEN** a student opens a lesson exercise in a `problem_default` lesson whose problem has `visible = [true, true, true]`
- **THEN** the statement's examples SHALL show all 3 tests' inputs and expected outputs

#### Scenario: Practice statement
- **WHEN** a user opens a published problem with `visible = [true, false, true, true]`
- **THEN** the statement's examples SHALL show tests 1, 3 and 4 and no other test
