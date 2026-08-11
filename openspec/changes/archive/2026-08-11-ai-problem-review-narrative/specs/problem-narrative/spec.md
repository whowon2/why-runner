## ADDED Requirements

### Requirement: Problem has an optional narrative field
The `problem` record SHALL support an optional `narrative` text field, nullable, defaulting to unset. The narrative SHALL NOT be required by the publish action and SHALL NOT appear in the set of fields checked by publish validation.

#### Scenario: Publishing without a narrative
- **WHEN** a problem has title, description, difficulty, test cases, and a passing validation run, but no narrative set
- **THEN** the publish action SHALL succeed exactly as it would with a narrative set

### Requirement: Author can request an AI-generated narrative draft
The system SHALL provide a "Generate Narrative with AI" action, available to the problem's creator on the problem edit workspace, that sends the problem's title, description, and difficulty to an LLM and returns a short themed story (in the style of Advent of Code or similar competitive-programming flavor text) framing the problem. The action SHALL NOT persist the result — it returns a draft for the author to review, edit, or discard.

#### Scenario: Successful narrative generation
- **WHEN** the problem's creator triggers "Generate Narrative with AI"
- **THEN** the system SHALL return a narrative draft as text, without writing it to the problem record

#### Scenario: Non-owner cannot request a narrative
- **WHEN** a user who is not the problem's creator calls the narrative generation action
- **THEN** the action SHALL be rejected and no LLM call SHALL be made

### Requirement: Narrative is saved through the existing problem update flow
The narrative field SHALL be editable in the problem edit form and saved via the same update action used for the problem's other fields (title, description, etc.), scoped to the problem's creator.

#### Scenario: Author saves an edited narrative
- **WHEN** the author edits the narrative field (whether AI-generated or hand-written) and saves the problem
- **THEN** the system SHALL persist the new narrative value to the problem record

#### Scenario: Author clears the narrative
- **WHEN** the author empties the narrative field and saves
- **THEN** the system SHALL persist the narrative as unset/null
