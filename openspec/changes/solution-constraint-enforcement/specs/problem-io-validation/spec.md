## MODIFIED Requirements

### Requirement: Triggering a validation run
The creator SHALL be able to trigger a validation run for their draft problem, which executes the current reference solution against the problem's current declared input/output pairs through the same sandboxed judge execution used for student submissions, and, if the problem has active solution constraints, also checks the reference solution against those constraints.

#### Scenario: Validate with no test cases
- **WHEN** the creator triggers validation on a draft problem with zero declared input/output pairs
- **THEN** the system SHALL reject the validation request and indicate that at least one test case is required

#### Scenario: Validate with no reference solution
- **WHEN** the creator triggers validation without having entered reference solution code or a language
- **THEN** the system SHALL reject the validation request and indicate the reference solution is required

#### Scenario: Successful validation trigger
- **WHEN** the creator triggers validation on a draft problem with a reference solution and at least one test case
- **THEN** the system SHALL create a `problemValidation` record with status `PENDING`, associated with the problem, the current reference solution, and a content hash of the current input/output pairs
- **AND** the system SHALL notify the judge worker of the new validation run

#### Scenario: Non-owner cannot trigger validation
- **WHEN** a user who is not the draft problem's creator attempts to trigger a validation run
- **THEN** the system SHALL reject the request

### Requirement: Per-test validation results
Once a validation run completes, the system SHALL display, per declared input/output pair, whether the reference solution's output matched the declared output, and for any mismatch, the declared (expected) output alongside the reference solution's actual output. If the problem has active solution constraints, the validation result SHALL also indicate, per constraint, whether the reference solution satisfied it.

#### Scenario: All test cases pass
- **WHEN** a validation run completes and the reference solution's output matches every declared output
- **THEN** the system SHALL mark the run as passed and show each test case as passing

#### Scenario: A test case fails
- **WHEN** a validation run completes and the reference solution's output does not match one or more declared outputs
- **THEN** the system SHALL mark the run as failed and, for each mismatching test case, show the declared expected output next to the reference solution's actual output

#### Scenario: Reference solution errors during execution
- **WHEN** the reference solution fails to compile/run, times out, or exceeds resource limits during a validation run
- **THEN** the system SHALL mark the run as failed with an error indication distinct from an output mismatch

#### Scenario: Reference solution violates an active constraint
- **WHEN** a validation run's reference solution passes all declared test cases but violates one of the problem's active solution constraints (structural or algorithm-requirement)
- **THEN** the system SHALL mark the run as failed, distinct from an output mismatch or execution error, and SHALL indicate which constraint was violated

#### Scenario: Reference solution satisfies all active constraints
- **WHEN** a validation run's reference solution passes all declared test cases and satisfies every active solution constraint
- **THEN** the system SHALL mark the run as passed

### Requirement: Validation staleness
A passing validation run SHALL be considered valid only for the exact input/output content and the exact set of active solution constraints it ran against. If the problem's input/output pairs or its solution constraints are changed after a passing run, the system SHALL treat that run as stale and no longer count it as a passing validation for this problem.

#### Scenario: Editing I/O after a pass invalidates it
- **WHEN** a draft problem has a passing validation run, and the creator then adds, removes, or edits any input or output pair, and saves
- **THEN** the previously passing validation run SHALL no longer be treated as valid for the problem's current state, and the workspace SHALL indicate re-validation is needed

#### Scenario: Editing solution constraints after a pass invalidates it
- **WHEN** a draft problem has a passing validation run, and the creator then adds, removes, or edits a solution constraint, and saves
- **THEN** the previously passing validation run SHALL no longer be treated as valid for the problem's current state, and the workspace SHALL indicate re-validation is needed

#### Scenario: Editing unrelated fields does not invalidate
- **WHEN** a draft problem has a passing validation run, and the creator edits only the title, description, or difficulty, and saves
- **THEN** the passing validation run SHALL remain valid
