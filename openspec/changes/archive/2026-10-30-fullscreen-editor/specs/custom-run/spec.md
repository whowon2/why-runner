## MODIFIED Requirements

### Requirement: Run with custom input in every code editor
Every code editor where a user submits a solution SHALL offer a "Run" action with a stdin textarea: in the editor workspace shell (problem, contest problem, and lesson exercise in `code` and `blocks` mode) the stdin box and the run result live in the Console panel and Run sits in the Actions panel. Run SHALL execute the editor's current program once with the textarea's content as stdin. In `blocks` mode the program SHALL be the Portugol generated from the current workspace, regenerated on the server. Parsons exercises SHALL NOT offer Run.

#### Scenario: Running code with custom input
- **WHEN** a student types `3 4` into the Console's input box of a problem workspace and clicks Run with a Python program that prints the sum
- **THEN** the Console shows status OK, exit code 0, stdout `7`, the run time and peak memory

#### Scenario: Empty input
- **WHEN** a student clicks Run with an empty input box
- **THEN** the program runs with empty stdin

#### Scenario: Blocks exercise
- **WHEN** a student clicks Run on a `blocks` exercise
- **THEN** the server generates Portugol from the submitted workspace and runs that, ignoring any client-sent code

#### Scenario: Parsons exercise
- **WHEN** a student opens a `parsons` exercise
- **THEN** no Run action and no example Play buttons are shown

#### Scenario: No language chosen
- **WHEN** a user clicks Run before selecting a language
- **THEN** the system warns that a language must be selected and creates no run

## ADDED Requirements

### Requirement: Play visible examples
Wherever Run is available, each test listed in the workspace's Test cases panel (only tests the viewer may already see) SHALL have a Play button that creates an ordinary run whose stdin is that test's input as already shown on the page, and "Run all test cases" SHALL run every listed test one after another (waiting for each run to finish, since only one run may be in flight). When a run finishes, the browser SHALL compare its stdout with that test's expected output using the problem's compare mode: `exact` (trimmed equality), `tokens` (whitespace-separated tokens equal), `float` (tokens, numbers within `float_epsilon` absolute or relative), matching the judge's rules. For `checker` problems no match verdict SHALL be shown, only the output. A non-`OK` run status SHALL be shown as that status. The comparison result is advisory, is never stored and never affects grading; the run request SHALL contain only the stdin, never the expected output or the test index.

#### Scenario: Example passes
- **WHEN** a student clicks Play on Example 1 of a `tokens` problem and the program prints `7\n` where the expected output is `7`
- **THEN** Example 1 is marked as matching and the Console shows input, expected output and the program's output

#### Scenario: Example mismatch
- **WHEN** the program prints `8` where `7` is expected
- **THEN** Example 1 is marked as not matching (wrong output) and the Console shows both outputs

#### Scenario: Run all is sequential
- **WHEN** a student clicks "Run all test cases" on a problem with 3 visible examples
- **THEN** 3 runs are created one after another, each starting after the previous finished, and each example row shows its own result

#### Scenario: Checker problem
- **WHEN** a student plays an example of a `checker` problem
- **THEN** the row shows the run finished and the Console shows the output, with no match / mismatch verdict

#### Scenario: Runs disabled
- **WHEN** `CUSTOM_RUN_ENABLED` is off or the contest disallows runs
- **THEN** the Test cases panel lists examples without Play buttons and Actions has no Run all
