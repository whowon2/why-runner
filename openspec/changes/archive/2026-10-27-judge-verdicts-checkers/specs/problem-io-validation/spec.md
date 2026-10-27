## MODIFIED Requirements

### Requirement: Validation staleness
A passing validation run SHALL be considered valid only for the exact input/output content, the exact output-comparison settings (mode, float tolerance, checker language and source) and the exact set of active solution constraints it ran against. If the problem's input/output pairs, its comparison settings or its solution constraints are changed after a passing run, the system SHALL treat that run as stale and no longer count it as a passing validation for this problem. Problems whose comparison mode is `exact` SHALL keep the staleness fingerprint they had before comparison modes existed, so migrated problems are not invalidated.

#### Scenario: Editing I/O after a pass invalidates it
- **WHEN** a draft problem has a passing validation run, and the creator then adds, removes, or edits any input or output pair, and saves
- **THEN** the previously passing validation run SHALL no longer be treated as valid for the problem's current state, and the workspace SHALL indicate re-validation is needed

#### Scenario: Editing comparison settings after a pass invalidates it
- **WHEN** a draft problem has a passing validation run, and the creator then changes the comparison mode, the float tolerance or the checker, and saves
- **THEN** the previously passing validation run SHALL no longer be treated as valid, and the workspace SHALL indicate re-validation is needed

#### Scenario: Migration does not invalidate existing validations
- **WHEN** the migration sets an existing validated problem's mode to `exact`
- **THEN** its passing validation run remains valid

#### Scenario: Editing solution constraints after a pass invalidates it
- **WHEN** a draft problem has a passing validation run, and the creator then adds, removes, or edits a solution constraint, and saves
- **THEN** the previously passing validation run SHALL no longer be treated as valid for the problem's current state, and the workspace SHALL indicate re-validation is needed

#### Scenario: Editing unrelated fields does not invalidate
- **WHEN** a draft problem has a passing validation run, and the creator edits only the title, description, or difficulty, and saves
- **THEN** the passing validation run SHALL remain valid

## ADDED Requirements

### Requirement: Validation report shows the verdict
A failed validation run SHALL show which verdict the reference solution got (wrong answer, time limit, memory limit, runtime error, compilation error, or judge/checker error) while the validation row's own status stays `PASSED` or `FAILED`.

#### Scenario: Reference solution times out
- **WHEN** a validation run's reference solution exceeds the time limit
- **THEN** the validation run is `FAILED` and the panel shows the time-limit-exceeded verdict

#### Scenario: Broken checker surfaces to the author
- **WHEN** a validation run's checker exits with an unexpected code
- **THEN** the validation run is `FAILED` and the panel shows a checker/judge error
