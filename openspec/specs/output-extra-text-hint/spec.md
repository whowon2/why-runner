# output-extra-text-hint Specification

## Purpose
TBD - created by archiving change survey-feedback-fixes. Update Purpose after archive.
## Requirements
### Requirement: Detect extra printed text
The system SHALL provide a pure function that, given a failing test's actual and expected output, reports extra text when all of these hold: the expected output is not blank, the outputs differ after normalizing line endings and whitespace, every non-blank expected line appears in order within the actual output, and the actual output left after removing those matches contains at least one letter.

#### Scenario: input() prompts before the answer
- **WHEN** expected is `1 8 27\n` and actual is `Digite os valores da linha 1:Digite os valores da linha 2:1 8 27\n`
- **THEN** the function reports extra text

#### Scenario: Whitespace-only difference
- **WHEN** expected is `1 8 27 \n` and actual is `1 8 27\n`
- **THEN** the function does not report extra text

#### Scenario: Extra numbers only
- **WHEN** expected is `1 2 3` and actual is `1 2 3 4`
- **THEN** the function does not report extra text

#### Scenario: Missing answer
- **WHEN** actual contains prompts but not the expected lines
- **THEN** the function does not report extra text

### Requirement: Hint shown in the failure view
When a submission's failing test is visible to the viewer, its verdict is wrong answer and the function reports extra text, the failure view SHALL show a localized hint (pt-BR and en): the program printed extra text, for example a prompt in `input()`, and it should print only what the output asks for. The hint SHALL appear wherever the shared failure view is rendered.

#### Scenario: Hint on an exercise failure
- **WHEN** a student expands a wrong-answer exercise submission whose output has `input()` prompts before the expected lines
- **THEN** the failure view shows the hint above the input and output blocks

#### Scenario: No hint on runtime error
- **WHEN** the failing test is a runtime error
- **THEN** no extra-text hint is shown

