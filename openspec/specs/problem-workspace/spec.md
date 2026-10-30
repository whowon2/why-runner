## Purpose

Defines the standalone problem page as a tabbed workspace (Task, Submit, Results, Statistics, Tests), giving users a single, linkable place to read a problem, submit a solution outside a contest, review their own results, view solve statistics, and access test cases.
## Requirements
### Requirement: Task tab shows description and limits
The workspace's statement column SHALL show the problem's description and visible examples, and the time limit and memory limit SHALL be shown in the top bar or at the top of the statement. When the problem has a narrative set, the statement SHALL display the narrative above the technical description, styled distinctly (e.g. as themed/flavor text) so it is visually distinguishable from the problem specification.

#### Scenario: Limits displayed
- **WHEN** a user opens a problem page
- **THEN** the system SHALL display the problem's time limit in seconds and memory limit in megabytes alongside the description

#### Scenario: Narrative displayed when present
- **WHEN** a user opens a problem that has a narrative set
- **THEN** the system SHALL render the narrative above the description, visually distinguished as flavor text

#### Scenario: No narrative set
- **WHEN** a user opens a problem with no narrative set
- **THEN** the system SHALL render the description with no narrative section shown

### Requirement: Submit tab allows submitting a solution outside a contest
The problem workspace SHALL let the user select a programming language, write or open a solution file in the editor, and submit it, creating a submission for that problem with no associated contest. The resulting verdict SHALL be shown in the same screen (Actions panel and Console) without navigating.

#### Scenario: Successful submission
- **WHEN** a user selects a language, provides code, and clicks Submit on a problem page
- **THEN** the system SHALL create a submission record for that problem with `contestId` set to null and status `PENDING`, the judge SHALL grade it through the existing pipeline, and the workspace SHALL show its status until the final verdict

### Requirement: Results tab lists the current user's submissions to the problem
The workspace's Submissions drawer SHALL show the current user's own submissions to this problem, with submission time, language, code size in characters, and result status. Each entry SHALL provide access to a details view.

#### Scenario: Results table scope
- **WHEN** a user opens the Submissions drawer on a problem page
- **THEN** the system SHALL list only that user's own practice submissions for that specific problem, most recent first

#### Scenario: Submission details view
- **WHEN** a user expands a submission in the drawer
- **THEN** the system SHALL show the submission's status/result detail and the submitted code. The input/output for the failing test case SHALL be shown only as allowed by the submission-feedback-visibility capability: full detail for sample tests or when the viewer created the problem, and only the verdict and test number for hidden tests.

#### Scenario: Visible failure shows the student's output
- **WHEN** a user expands a wrong-answer submission that failed a visible test
- **THEN** the system SHALL show, each with its own label, the input, the user's output, the expected output and any stderr

#### Scenario: Hidden test failure details view
- **WHEN** a user who did not create the problem opens the details of a submission that failed a hidden test
- **THEN** the system SHALL show a localized message naming the verdict and test number, and SHALL NOT show that test's input, expected output, actual output, or stderr

### Requirement: Statistics tab shows problem-wide solve statistics
The workspace's Statistics drawer SHALL show the number of users who solved the problem, the number of users who attempted it, and the resulting success rate.

#### Scenario: Success rate computed
- **WHEN** a user opens the Statistics drawer
- **THEN** the system SHALL display solved-by count, attempted-by count, and success rate computed as solved-by divided by attempted-by

### Requirement: Tests tab shows the problem's test cases
The workspace's Test cases panel SHALL list sample test cases (input/output pairs) for any user, where the samples are the tests whose `visible` flag is `true`, labelled with their original test numbers. The Tests drawer SHALL, if the current user has at least one `PASSED` submission for the problem, additionally list and allow downloading all of the problem's test cases (input/output pairs), not just samples.

#### Scenario: Viewing test cases
- **WHEN** a user who has not solved the problem opens the problem
- **THEN** the Test cases panel SHALL list only the sample test cases

#### Scenario: Non-contiguous samples keep their numbers
- **WHEN** a problem has `visible = [false, true, false, true]` and an unsolved user opens it
- **THEN** the system SHALL list "Test 2" and "Test 4" only

#### Scenario: Full test cases unlocked after solving
- **WHEN** a user who has at least one `PASSED` submission for the problem opens the Tests drawer
- **THEN** the system SHALL list all of the problem's test cases (input/output pairs), not just samples

#### Scenario: Downloading test cases
- **WHEN** a user with at least one `PASSED` submission for the problem requests to download tests from the Tests drawer
- **THEN** the system SHALL provide all of the problem's test cases as a downloadable archive

#### Scenario: Download locked before solving
- **WHEN** a user with no `PASSED` submission for the problem opens the Tests drawer
- **THEN** the system SHALL NOT provide the full test-case archive (only sample cases remain visible)

### Requirement: Problem owners edit on a separate page
The problem owner (or an admin) SHALL edit the problem at `/problems/[slug]/edit`, a regular (non-fullscreen) page with the existing edit form, validation, AI review panel, and for drafts the Publish and Delete actions. The workspace rail SHALL show an Edit item linking there for owners. Opening `/problems/[slug]` as the owner of a draft with no `tab` parameter SHALL redirect to the edit page; the edit page SHALL link back to the workspace to try the problem.

#### Scenario: Owner opens draft
- **WHEN** the owner of a draft problem opens `/problems/<slug>`
- **THEN** they are redirected to `/problems/<slug>/edit`

#### Scenario: Non-owner
- **WHEN** a user who does not own the problem and is not an admin opens `/problems/<slug>/edit`
- **THEN** the page returns not found

