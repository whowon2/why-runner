## ADDED Requirements

### Requirement: Problem code generated at creation
Every problem SHALL be assigned a `code`: a short, unique, alphanumeric identifier generated automatically when the problem row is created, independent of and in addition to its `id` and `slug`.

#### Scenario: Code assigned on problem creation
- **WHEN** a new problem is created (via "Create Problem" or bulk import)
- **THEN** the created problem has a non-empty `code` that no other problem shares

#### Scenario: Codes are monotonically assigned
- **WHEN** problems are created in sequence
- **THEN** each new problem's `code` sorts after all previously assigned codes, growing in length only as needed (e.g. `0`, `1`, ... `9`, `A`, ... `Z`, `10`, ...)

### Requirement: Code is immutable and not user-editable
Once assigned, a problem's `code` SHALL NOT change, and SHALL NOT be exposed as an editable field in the problem create/edit form.

#### Scenario: Editing a problem does not change its code
- **WHEN** the creator edits and saves a problem's title, description, or other fields
- **THEN** the problem's `code` remains unchanged

### Requirement: Code displayed wherever problems are listed for selection
Any UI that lists problems for a user to identify or select one among several (the problems list table, the contest problem picker) SHALL display each problem's `code` alongside its title.

#### Scenario: Two problems share a title
- **WHEN** two problems both titled "Two Sum" appear in the problems list or the contest problem picker
- **THEN** each is shown with its distinct `code` so a user can tell them apart
