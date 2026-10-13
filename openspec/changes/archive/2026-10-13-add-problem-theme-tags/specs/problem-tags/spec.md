## ADDED Requirements

### Requirement: Fixed theme tag taxonomy
The system SHALL define a single fixed set of problem theme tags, each identified by a stable kebab-case key and displayed with a localized label in every supported locale (en, pt-BR). The set SHALL be split into two groups. **Fundamentals** (intro-programming constructs): `input-output`, `conditionals`, `loops`, `arrays`, `matrices`, `strings`, `functions`, `recursion`. **Algorithms** (competitive-programming techniques): `math`, `number-theory`, `combinatorics`, `geometry`, `sorting`, `binary-search`, `two-pointers`, `greedy`, `brute-force`, `simulation`, `dynamic-programming`, `graphs`, `trees`, `shortest-paths`, `data-structures`, `bit-manipulation`. The set SHALL NOT include catch-all tags without a concrete meaning (e.g. "implementation"). Users SHALL NOT be able to create tags outside this set.

#### Scenario: Tag labels are localized
- **WHEN** a user views any tag in the UI with the locale set to pt-BR
- **THEN** the tag SHALL be displayed with its pt-BR label rather than its key

#### Scenario: Picker shows grouped tags
- **WHEN** a user opens the tag picker (in the edit form or the list filter)
- **THEN** the tags SHALL be listed under localized "Fundamentals" and "Algorithms" headings, in taxonomy order, and SHALL be searchable by localized label

#### Scenario: Unknown tag is rejected
- **WHEN** any server action receives a tag key that is not in the taxonomy (from the edit form, import, or AI output)
- **THEN** the system SHALL NOT persist that tag

### Requirement: Problems carry zero or more tags
Each problem SHALL store a set of zero or more distinct theme tags. Existing problems and newly created drafts SHALL start with no tags. Tags SHALL NOT be required to publish a problem.

#### Scenario: New draft has no tags
- **WHEN** a user clicks "Create Problem"
- **THEN** the created draft SHALL have an empty tag set

#### Scenario: Publishing without tags
- **WHEN** the creator publishes a problem that meets all existing publish requirements but has no tags
- **THEN** the publish SHALL succeed

#### Scenario: Duplicate tags collapse
- **WHEN** a save request contains the same tag more than once
- **THEN** the problem SHALL store that tag only once

### Requirement: Author edits tags in the problem form
The problem create/edit form SHALL provide a tag picker, available only to the problem's creator, that lets the author select and deselect tags from the taxonomy. Tag changes SHALL be persisted only when the author saves the form, together with the other fields.

#### Scenario: Author adds tags and saves
- **WHEN** the creator selects `graphs` and `shortest-paths` in the picker and saves the form
- **THEN** the problem SHALL be stored with exactly those two tags

#### Scenario: Author removes a tag without saving
- **WHEN** the creator deselects a tag but navigates away without saving
- **THEN** the problem's stored tags SHALL remain unchanged

#### Scenario: Non-owner cannot change tags
- **WHEN** a user who is not the problem's creator calls the update action with tags
- **THEN** the update SHALL be rejected and the problem's tags SHALL remain unchanged

### Requirement: AI suggests tags for a problem
The problem create/edit form SHALL provide a "Suggest tags with AI" action, available only to the problem's creator, that sends the problem's current (possibly unsaved) title and description from the form to the LLM and returns between 1 and 5 tags chosen only from the taxonomy, describing what a student must know or apply to solve the problem: intro-level problems SHALL be tagged with fundamentals tags, and algorithms tags SHALL be added only when the technique is genuinely required. The suggestion SHALL replace the picker's current selection in the open form and SHALL NOT be persisted until the author saves. The action SHALL make no LLM call unless explicitly triggered by the author.

#### Scenario: Successful suggestion
- **WHEN** the creator, with a description about finding the cheapest route between cities, clicks "Suggest tags with AI"
- **THEN** the picker SHALL be pre-filled with the suggested tags (e.g. `graphs`, `shortest-paths`) and the stored problem SHALL remain unchanged until the author saves

#### Scenario: Intro-level problem
- **WHEN** the creator requests tags for FizzBuzz
- **THEN** the suggestion SHALL consist of fundamentals tags such as `loops` and `conditionals`, not a catch-all tag

#### Scenario: Suggestion uses unsaved description
- **WHEN** the creator edits the description in the form and clicks "Suggest tags with AI" without saving first
- **THEN** the suggestion SHALL be based on the edited description, not the previously saved one

#### Scenario: Empty description
- **WHEN** the creator clicks "Suggest tags with AI" while the description is empty
- **THEN** the system SHALL show an error asking for a description first and SHALL NOT make an LLM call

#### Scenario: Non-owner cannot request suggestions
- **WHEN** a user who is not the problem's creator calls the suggestion action
- **THEN** the action SHALL be rejected and no LLM call SHALL be made

#### Scenario: LLM returns an out-of-taxonomy tag
- **WHEN** the LLM response includes a tag key not in the taxonomy
- **THEN** that tag SHALL NOT be returned to the form (the output is enum-constrained and re-validated; an invalid response is treated as a failed attempt)

#### Scenario: LLM call fails
- **WHEN** the LLM call errors or returns unparsable output
- **THEN** the form SHALL show an error toast and the picker's selection SHALL remain unchanged

### Requirement: Tags are shown on the problem page
The problem view SHALL display the problem's tags, with localized labels, next to its difficulty badge. A problem with no tags SHALL show no tag area.

#### Scenario: Tagged problem
- **WHEN** a user opens a problem tagged `greedy` and `sorting`
- **THEN** the problem header SHALL show both tags alongside the difficulty badge

### Requirement: JSON import accepts tags
The problem JSON import SHALL accept an optional `tags` array per problem. Valid tag keys SHALL be stored on the imported problem; an import entry containing a key not in the taxonomy SHALL fail validation with an error naming the invalid tag, consistent with how other invalid import fields are rejected.

#### Scenario: Import with tags
- **WHEN** a user imports a file whose problem entry has `"tags": ["strings", "two-pointers"]`
- **THEN** the imported problem SHALL be stored with those two tags

#### Scenario: Import without tags
- **WHEN** a user imports a file whose entries have no `tags` field
- **THEN** the imported problems SHALL be stored with no tags

#### Scenario: Import with invalid tag
- **WHEN** a user imports a file containing `"tags": ["dp"]`
- **THEN** the import SHALL be rejected with a validation error and no problems from that file SHALL be created
