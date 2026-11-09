## ADDED Requirements

### Requirement: AI authoring tools answer in the teacher's site language
The narrative generator, the AI problem review, and the reference-solution generator SHALL receive the requesting teacher's site locale and SHALL instruct the model to write its free-text output in that language. The locale SHALL be clamped to a supported locale (`en` → English, anything else → Brazilian Portuguese) before it is used in a prompt.

#### Scenario: Narrative in Portuguese
- **WHEN** a teacher with the site in Portuguese (`br`) generates a narrative
- **THEN** the prompt instructs the model to write the narrative in Brazilian Portuguese

#### Scenario: Narrative in English
- **WHEN** a teacher with the site in English (`en`) generates a narrative
- **THEN** the prompt instructs the model to write the narrative in English

#### Scenario: Unknown locale is clamped
- **WHEN** the action receives a locale that is not a supported value
- **THEN** it uses Brazilian Portuguese and the raw value does not appear in the prompt

### Requirement: Review feedback is localized but edge-case data is not
The AI problem review SHALL instruct the model to write `descriptionFeedback` and each edge case's `rationale` in the teacher's site language, and SHALL instruct it to keep each edge case's `input` and `output` as exact test data in the format the problem statement defines, untranslated.

#### Scenario: Review in Portuguese
- **WHEN** a teacher with the site in Portuguese requests a review
- **THEN** the description feedback and rationales are requested in Brazilian Portuguese, while the edge-case inputs/outputs are requested verbatim

### Requirement: Reference-solution comments follow the site language
The reference-solution generator SHALL instruct the model to write any code comments in the teacher's site language, without changing the raw-code-only output contract.

#### Scenario: Reference solution in Portuguese
- **WHEN** a teacher with the site in Portuguese generates a reference solution
- **THEN** the prompt asks for comments, if any, in Brazilian Portuguese and still asks for raw source code only
