# submission-code-normalization Specification

## Purpose
TBD - created by archiving change survey-feedback-fixes. Update Purpose after archive.
## Requirements
### Requirement: Submitted code is normalized before judging
The submission actions for contests, practice problems and lesson exercises in code mode SHALL normalize the submitted code before storing and judging it: U+00A0, U+2007 and U+202F become a space; U+200B, U+200C, U+200D, U+2060 and U+FEFF are removed; CRLF, lone CR, U+2028 and U+2029 become LF; for `python` only, each leading tab of a line becomes four spaces. Other characters, including typographic quotes, SHALL be kept unchanged.

#### Scenario: Non-breaking space indentation
- **WHEN** a student submits Python code indented with U+00A0 characters
- **THEN** the stored code is indented with regular spaces and the judge does not report `invalid non-printable character`

#### Scenario: Pasted tab block in Python
- **WHEN** Python code has one block indented with tabs and the rest with four spaces
- **THEN** the stored code uses only spaces and runs without `TabError`

#### Scenario: Other languages keep tabs
- **WHEN** C code indented with tabs is submitted
- **THEN** the tabs are kept

#### Scenario: Smart quotes kept
- **WHEN** code contains `“` or `”`
- **THEN** those characters are stored unchanged

