## MODIFIED Requirements

### Requirement: Results tab lists the current user's submissions to the problem
The Results tab SHALL show a table of the current user's own submissions to this problem, with columns for submission time, language, code size in characters, and result status. Each row SHALL provide access to a details view. The details view SHALL render the failing-test report with the same component used by contest and exercise submission lists.

#### Scenario: Results table scope
- **WHEN** a user opens the Results tab on a problem page
- **THEN** the system SHALL list only that user's own submissions for that specific problem, most recent first

#### Scenario: Submission details view
- **WHEN** a user opens the details view for a submission row
- **THEN** the system SHALL show the submission's status/result detail and the submitted code. The input/output for the failing test case SHALL be shown only as allowed by the submission-feedback-visibility capability: full detail for sample tests or when the viewer created the problem, and only the verdict and test number for hidden tests.

#### Scenario: Visible failure shows the student's output
- **WHEN** a user opens the details view of a wrong-answer submission that failed a visible test
- **THEN** the system SHALL show, each with its own label, the input, the user's output, the expected output and any stderr

#### Scenario: Hidden test failure details view
- **WHEN** a user who did not create the problem opens the details view of a submission that failed a hidden test
- **THEN** the system SHALL show a localized message naming the verdict and test number, and SHALL NOT show that test's input, expected output, actual output, or stderr
