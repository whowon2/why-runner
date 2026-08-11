## Purpose

Defines AI-assisted review of a draft problem: sending the problem's title, description, and test cases to an LLM for structured feedback and suggested edge cases, without ever mutating the problem itself.

## Requirements

### Requirement: Author can request an AI review of a draft problem
The system SHALL provide a "Review with AI" action, available to the problem's creator on the problem edit workspace, that sends the problem's title, description, and current test cases to an LLM and returns structured feedback: markdown-formatted description critique plus a list of suggested edge-case test cases, each with an input, an expected output, and a rationale. The action SHALL NOT modify the problem in any way — it only returns a draft result for the author to review.

#### Scenario: Successful review
- **WHEN** the problem's creator triggers "Review with AI" on a draft or published problem they own
- **THEN** the system SHALL return description feedback text and zero or more suggested edge cases, without writing anything to the problem record

#### Scenario: Non-owner cannot request a review
- **WHEN** a user who is not the problem's creator calls the review action
- **THEN** the action SHALL be rejected and no LLM call SHALL be made

#### Scenario: Review of an incomplete problem
- **WHEN** the problem has no description or no existing test cases
- **THEN** the system SHALL still return a result (e.g. feedback prompting the author to add a description/tests first) rather than erroring, unless the underlying LLM call itself fails

### Requirement: Suggested edge cases can be added to the problem's test cases with one action
For each suggested edge case returned by a review, the workspace UI SHALL provide a control that appends that edge case's input/output pair to the problem's test case list in the currently open edit form. Adding a suggested edge case SHALL NOT itself save the problem — the addition SHALL follow the same explicit save step as any other manual test case edit.

#### Scenario: Author accepts a suggested edge case
- **WHEN** the author clicks the "add" control on a suggested edge case
- **THEN** the system SHALL append that input/output pair to the form's test case list, and the problem record SHALL remain unchanged until the author explicitly saves

#### Scenario: Author ignores a suggested edge case
- **WHEN** the author does not interact with a suggested edge case
- **THEN** the problem's test cases SHALL remain unchanged
