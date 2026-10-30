## MODIFIED Requirements

### Requirement: Accepted payload shape
The import payload SHALL be either a JSON array of problem objects or an object with a `problems` array. Each problem object SHALL accept:
- `title` (string, required, non-empty)
- `description` (string, required, non-empty, Markdown)
- `inputs` (array of strings, required, at least one item)
- `outputs` (array of strings, required, same length as `inputs`)
- `visible` (array of booleans, optional, same length as `inputs`; `true` marks a test as an example shown to students)
- `exampleCount` (deprecated; integer ≥ 0 and ≤ number of test cases, optional; converted on import to `visible` with the first `exampleCount` tests visible)
- `difficulty` (`"easy" | "medium" | "hard"`, optional, defaults to unset)
- `tags` (array of taxonomy tag keys, optional, defaults to empty, duplicates removed)
- `narrative` (string, optional)
- `timeLimitMs` (integer, optional, defaults to 1000, bounded to a sane range)
- `memoryLimitMb` (integer, optional, defaults to 512, bounded to a sane range)

A problem SHALL NOT set both `visible` and `exampleCount`. When neither is given, only the first test SHALL be visible.

Unknown keys on a problem object SHALL be reported as validation errors rather than silently dropped.

#### Scenario: Wrapped root object
- **WHEN** the payload is `{ "problems": [ ... ] }` with valid entries
- **THEN** it is accepted identically to the bare array form

#### Scenario: Mismatched test case counts
- **WHEN** a problem has 5 `inputs` and 4 `outputs`
- **THEN** validation fails with an error located at that problem's `outputs` field stating the lengths must match

#### Scenario: visible length mismatch
- **WHEN** a problem has 3 test cases and `visible: [true, false]`
- **THEN** validation fails with an error located at that problem's `visible` field stating the lengths must match

#### Scenario: Per-test visibility imported
- **WHEN** a problem has 3 test cases and `visible: [false, true, false]`
- **THEN** the imported problem is stored with only test 2 visible

#### Scenario: Legacy exampleCount converted
- **WHEN** a problem has 4 test cases and `exampleCount: 2`
- **THEN** the imported problem is stored with `visible = [true, true, false, false]`

#### Scenario: exampleCount exceeds test cases
- **WHEN** a problem has 3 test cases and `exampleCount: 5`
- **THEN** validation fails with an error located at that problem's `exampleCount` field

#### Scenario: Both visible and exampleCount
- **WHEN** a problem sets both `visible` and `exampleCount`
- **THEN** validation fails with an error located at that problem's `exampleCount` field saying to use `visible` only

#### Scenario: Neither given
- **WHEN** a problem with 3 test cases sets neither `visible` nor `exampleCount`
- **THEN** the imported problem is stored with `visible = [true, false, false]`

#### Scenario: Unknown field
- **WHEN** a problem object contains `"input": [...]` (typo for `inputs`)
- **THEN** validation fails with an error naming the unrecognized key `input` on that problem

#### Scenario: Optional limits provided
- **WHEN** a problem includes `"timeLimitMs": 2000, "memoryLimitMb": 256`
- **THEN** the imported problem is stored with those limits

#### Scenario: Empty payload
- **WHEN** the payload contains zero problems
- **THEN** validation fails stating the file contains no problems
