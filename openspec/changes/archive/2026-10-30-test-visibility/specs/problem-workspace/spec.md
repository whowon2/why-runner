## MODIFIED Requirements

### Requirement: Tests tab shows the problem's test cases
The Tests tab SHALL list sample test cases (input/output pairs) for any user, where the samples are the tests whose `visible` flag is `true`, labelled with their original test numbers. If the current user has at least one `PASSED` submission for the problem, the Tests tab SHALL additionally list and allow downloading all of the problem's test cases (input/output pairs), not just samples.

#### Scenario: Viewing test cases
- **WHEN** a user who has not solved the problem opens the Tests tab
- **THEN** the system SHALL list only the sample test cases (input/output pairs)

#### Scenario: Non-contiguous samples keep their numbers
- **WHEN** a problem has `visible = [false, true, false, true]` and an unsolved user opens the Tests tab
- **THEN** the system SHALL list "Test 2" and "Test 4" only

#### Scenario: Full test cases unlocked after solving
- **WHEN** a user who has at least one `PASSED` submission for the problem opens the Tests tab
- **THEN** the system SHALL list all of the problem's test cases (input/output pairs), not just samples

#### Scenario: Downloading test cases
- **WHEN** a user with at least one `PASSED` submission for the problem requests to download tests from the Tests tab
- **THEN** the system SHALL provide all of the problem's test cases as a downloadable archive

#### Scenario: Download locked before solving
- **WHEN** a user with no `PASSED` submission for the problem requests to download tests from the Tests tab
- **THEN** the system SHALL NOT provide the full test-case archive (only sample cases remain visible)
