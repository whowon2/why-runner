## Purpose

Defines JSON bulk import of problems: the accepted payload format and its in-app documentation and template, file-or-paste input, client-side preview with located validation errors, and authoritative server-side validation with all-or-nothing creation of published problems.

## Requirements

### Requirement: Import format is documented in-app
The problems list SHALL open an import dialog (instead of a bare file picker) that documents the accepted JSON format without requiring the user to read source code. The documentation SHALL list every accepted field with its type, whether it is required, its default when omitted, and its allowed values (including the full problem tag taxonomy and the difficulty values), and SHALL show a complete example payload.

#### Scenario: User opens the import dialog
- **WHEN** an authenticated user clicks "Import" on the problems list
- **THEN** a dialog opens showing a field reference table and an example JSON payload
- **AND** no file picker opens until the user chooses to upload a file

#### Scenario: Reference lists allowed tag keys
- **WHEN** the user views the field reference for `tags`
- **THEN** every tag key in the taxonomy is listed as an allowed value

### Requirement: Downloadable template
The import dialog SHALL offer a "Download template" action that saves a JSON file containing a valid example payload, such that importing the unmodified template succeeds.

#### Scenario: Download and re-import template
- **WHEN** the user downloads the template and imports it without changes
- **THEN** validation passes and the import succeeds

### Requirement: File upload or paste
The import dialog SHALL accept the JSON payload either by uploading a `.json` file or by pasting JSON text.

#### Scenario: Paste JSON
- **WHEN** the user pastes a valid JSON payload into the dialog's text area
- **THEN** the payload is validated and previewed exactly as an uploaded file would be

#### Scenario: Malformed JSON
- **WHEN** the supplied text is not parseable JSON
- **THEN** the dialog shows a JSON syntax error (including the parser's position information when available) and the Import action stays disabled

### Requirement: Accepted payload shape
The import payload SHALL be either a JSON array of problem objects or an object with a `problems` array. Each problem object SHALL accept:
- `title` (string, required, non-empty)
- `description` (string, required, non-empty, Markdown)
- `inputs` (array of strings, required, at least one item)
- `outputs` (array of strings, required, same length as `inputs`)
- `difficulty` (`"easy" | "medium" | "hard"`, optional, defaults to unset)
- `tags` (array of taxonomy tag keys, optional, defaults to empty, duplicates removed)
- `exampleCount` (integer ≥ 1 and ≤ number of test cases, optional, defaults to 1)
- `narrative` (string, optional)
- `timeLimitMs` (integer, optional, defaults to 1000, bounded to a sane range)
- `memoryLimitMb` (integer, optional, defaults to 512, bounded to a sane range)

Unknown keys on a problem object SHALL be reported as validation errors rather than silently dropped.

#### Scenario: Wrapped root object
- **WHEN** the payload is `{ "problems": [ ... ] }` with valid entries
- **THEN** it is accepted identically to the bare array form

#### Scenario: Mismatched test case counts
- **WHEN** a problem has 5 `inputs` and 4 `outputs`
- **THEN** validation fails with an error located at that problem's `outputs` field stating the lengths must match

#### Scenario: exampleCount exceeds test cases
- **WHEN** a problem has 3 test cases and `exampleCount: 5`
- **THEN** validation fails with an error located at that problem's `exampleCount` field

#### Scenario: Unknown field
- **WHEN** a problem object contains `"input": [...]` (typo for `inputs`)
- **THEN** validation fails with an error naming the unrecognized key `input` on that problem

#### Scenario: Optional limits provided
- **WHEN** a problem includes `"timeLimitMs": 2000, "memoryLimitMb": 256`
- **THEN** the imported problem is stored with those limits

#### Scenario: Empty payload
- **WHEN** the payload contains zero problems
- **THEN** validation fails stating the file contains no problems

### Requirement: Preview with located errors before import
Before creating any problem, the dialog SHALL validate the payload and show a preview listing each problem (index, title, difficulty, test-case count, example count, tags). The dialog SHALL list every validation error found (not only the first), each identifying the problem by index and title (when available) and the field path. The Import action SHALL be disabled while any error exists.

#### Scenario: Valid payload preview
- **WHEN** the user supplies a valid payload of 12 problems
- **THEN** the preview lists 12 rows and the Import button is enabled and states the count (e.g. "Import 12 problems")

#### Scenario: Multiple errors shown together
- **WHEN** problem #2 is missing `description` and problem #7 has an invalid tag `"dp"`
- **THEN** both errors are shown, e.g. `#2 "Sum" → description: Required` and `#7 "Knapsack" → tags[0]: invalid tag "dp"`
- **AND** the Import button is disabled

### Requirement: Server-side validation and all-or-nothing creation
The import server action SHALL re-validate the payload with the same rules as the client preview, independent of client-side checks. On failure it SHALL return the full list of located errors and create no problems. On success it SHALL create all problems in a single atomic operation, each with `status = published`, a generated unique slug and code, and `createdBy` set to the current user, and return the number created.

#### Scenario: Server rejects invalid payload sent directly
- **WHEN** the server action is called with a payload that fails validation (bypassing the dialog)
- **THEN** it returns the located errors and no problem rows are inserted

#### Scenario: Successful import
- **WHEN** the user confirms import of a valid payload of N problems
- **THEN** N published problems are created, a success toast states N, the dialog closes, and the problems list refreshes
