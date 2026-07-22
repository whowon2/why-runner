## ADDED Requirements

### Requirement: Standalone problem page is organized into tabs
The system SHALL present the standalone problem page as a tabbed workspace with exactly 5 tabs: Task, Submit, Results, Statistics, and Tests. Tab selection SHALL be reflected in the URL so tabs are directly linkable and back/forward navigation switches tabs.

#### Scenario: Default tab
- **WHEN** a user navigates to a problem page with no tab specified
- **THEN** the system SHALL show the Task tab by default

#### Scenario: Switching tabs updates the URL
- **WHEN** a user clicks a different tab
- **THEN** the system SHALL update the URL to reflect the selected tab and render that tab's content without a full page reload

### Requirement: Task tab shows description and limits
The Task tab SHALL show the problem's description, examples, time limit, and memory limit.

#### Scenario: Limits displayed
- **WHEN** a user views the Task tab
- **THEN** the system SHALL display the problem's time limit in seconds and memory limit in megabytes alongside the description

### Requirement: Submit tab allows submitting a solution outside a contest
The Submit tab SHALL let the user select a programming language and upload/select a solution file, then create a submission for that problem with no associated contest.

#### Scenario: Successful submission
- **WHEN** a user selects a language, provides a solution file, and submits on the Submit tab of a problem page
- **THEN** the system SHALL create a submission record for that problem with `contestId` set to null and status `PENDING`, and the judge SHALL grade it through the existing pipeline

### Requirement: Results tab lists the current user's submissions to the problem
The Results tab SHALL show a table of the current user's own submissions to this problem, with columns for submission time, language, code size in characters, and result status. Each row SHALL provide access to a details view.

#### Scenario: Results table scope
- **WHEN** a user opens the Results tab on a problem page
- **THEN** the system SHALL list only that user's own submissions for that specific problem, most recent first

#### Scenario: Submission details view
- **WHEN** a user opens the details view for a submission row
- **THEN** the system SHALL show the submission's status/result detail, the submitted code, and the input/output for the relevant test case(s)

### Requirement: Statistics tab shows problem-wide solve statistics
The Statistics tab SHALL show the number of users who solved the problem, the number of users who attempted it, and the resulting success rate.

#### Scenario: Success rate computed
- **WHEN** a user opens the Statistics tab
- **THEN** the system SHALL display solved-by count, attempted-by count, and success rate computed as solved-by divided by attempted-by

### Requirement: Tests tab shows the problem's test cases
The Tests tab SHALL list sample test cases (input/output pairs) for any user. If the current user has at least one `PASSED` submission for the problem, the Tests tab SHALL additionally list and allow downloading all of the problem's test cases (input/output pairs), not just samples.

#### Scenario: Viewing test cases
- **WHEN** a user who has not solved the problem opens the Tests tab
- **THEN** the system SHALL list only the sample test cases (input/output pairs)

#### Scenario: Full test cases unlocked after solving
- **WHEN** a user who has at least one `PASSED` submission for the problem opens the Tests tab
- **THEN** the system SHALL list all of the problem's test cases (input/output pairs), not just samples

#### Scenario: Downloading test cases
- **WHEN** a user with at least one `PASSED` submission for the problem requests to download tests from the Tests tab
- **THEN** the system SHALL provide all of the problem's test cases as a downloadable archive

#### Scenario: Download locked before solving
- **WHEN** a user with no `PASSED` submission for the problem requests to download tests from the Tests tab
- **THEN** the system SHALL NOT provide the full test-case archive (only sample cases remain visible)
