## ADDED Requirements

### Requirement: Per-problem comparison mode
Each problem SHALL have a comparison mode `exact`, `tokens`, `float` or `checker`, and a float tolerance ε (default 1e-6). Problems created after this change SHALL default to `tokens`; problems existing before the migration SHALL be set to `exact`.

#### Scenario: Existing problem keeps old behaviour
- **WHEN** the migration runs on a problem created before it
- **THEN** that problem's comparison mode is `exact`

#### Scenario: New problem default
- **WHEN** a professor creates a new problem without choosing a mode
- **THEN** its comparison mode is `tokens`

### Requirement: Built-in comparison semantics
The judge SHALL compare a successful run's stdout with the declared output as follows:
- `exact`: equal after trimming leading/trailing whitespace of both;
- `tokens`: the whitespace-separated token sequences are equal;
- `float`: the token sequences have the same length and each pair matches, where two tokens that both parse as finite numbers match when `|a−b| ≤ ε` or `|a−b| ≤ ε·|b|`, and any other pair matches only when the strings are equal.

#### Scenario: Exact rejects inner spacing differences
- **WHEN** mode is `exact`, expected is `1 2` and the program prints `1  2`
- **THEN** the test fails with `WRONG_ANSWER`

#### Scenario: Tokens ignores spacing and line breaks
- **WHEN** mode is `tokens`, expected is `1 2\n3` and the program prints `1\n2 3\n\n`
- **THEN** the test passes

#### Scenario: Float within tolerance
- **WHEN** mode is `float` with ε = 1e-6, expected is `0.333333` and the program prints `0.3333331`
- **THEN** the test passes

#### Scenario: Float outside tolerance
- **WHEN** mode is `float` with ε = 1e-6, expected is `0.5` and the program prints `0.51`
- **THEN** the test fails with `WRONG_ANSWER`

#### Scenario: Float compares words exactly
- **WHEN** mode is `float`, expected is `YES 1.0` and the program prints `yes 1.0`
- **THEN** the test fails with `WRONG_ANSWER`

### Requirement: Custom checker
When a problem's mode is `checker`, the judge SHALL run the problem author's checker program in the sandbox for each test case whose run succeeded, with the files `input.txt`, `output.txt` (program output) and `answer.txt` (declared output) passed as arguments in that order. Exit code 0 SHALL mean accepted, exit code 1 SHALL mean `WRONG_ANSWER` (the checker's stdout, truncated, becomes the failure message), and any other outcome (other exit code, timeout, checker compile failure, missing checker) SHALL make the submission `ERROR`. Checker languages SHALL be any judge language except Portugol.

#### Scenario: Checker accepts an alternative answer
- **WHEN** a problem accepts any valid permutation and its checker exits 0 for the program's output
- **THEN** the test passes even though the output differs from the declared output

#### Scenario: Checker rejects
- **WHEN** the checker exits 1 and prints `wrong sum`
- **THEN** the submission is `WRONG_ANSWER` and the failure message includes `wrong sum`

#### Scenario: Broken checker is a judge fault
- **WHEN** the checker fails to compile or exits with code 3
- **THEN** the submission is `ERROR`, which is not penalised in contests

### Requirement: Checker source is author-only
The checker's source code SHALL only be returned to the problem's creator (problem edit). Student-facing problem, contest and submission queries SHALL NOT return it.

#### Scenario: Student loads a checker problem
- **WHEN** a student opens a problem whose mode is `checker`
- **THEN** no response sent to the student contains the checker source

### Requirement: Professor configures comparison
The problem edit form SHALL let the creator choose the comparison mode, set ε when the mode is `float`, and set the checker language and source when the mode is `checker`. The server SHALL validate ε in (0, 1] and SHALL reject `checker` mode when no checker source is provided or stored.

#### Scenario: Selecting float mode
- **WHEN** the creator selects `float`, sets ε to 1e-4 and saves
- **THEN** the problem's mode is `float` and ε is 1e-4

#### Scenario: Checker mode without source
- **WHEN** the creator selects `checker` without providing checker source and saves
- **THEN** the save is rejected with an error message

#### Scenario: Non-owner cannot change comparison
- **WHEN** a user who did not create the problem calls the update action with comparison settings
- **THEN** nothing is written
