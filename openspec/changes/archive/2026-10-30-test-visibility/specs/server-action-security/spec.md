## MODIFIED Requirements

### Requirement: Update actions use field allowlists
`updateProblem` and `updateContest` SHALL parse their input with an explicit zod schema listing the editable fields, and SHALL write only those fields:
- `updateProblem`: title, description, narrative, difficulty, tags, inputs, outputs, visible, compareMode, floatEpsilon, checker
- `updateContest`: name, description, startDate, endDate, isPrivate, aiAssistance

Fields not in the schema (including `id`, `status`, `createdBy`, `code`, `slug`, `createdAt`) SHALL be ignored or rejected, never written. `status` SHALL change only through the publish actions. A lesson's `testVisibility` SHALL be written only through `updateLesson`, which SHALL accept only one of the `testVisibility` enum values and write only when the caller owns the lesson.

#### Scenario: Owner tries to publish through update
- **WHEN** a problem owner calls `updateProblem` with `status: "published"`
- **THEN** the problem's status SHALL remain unchanged

#### Scenario: Owner tries to transfer ownership
- **WHEN** an owner calls `updateContest` with `createdBy` set to another user's id
- **THEN** the contest's `createdBy` SHALL remain unchanged

#### Scenario: Legacy exampleCount is not written
- **WHEN** a client calls `updateProblem` with `exampleCount: 3`
- **THEN** no column SHALL be written for it, and `visible` SHALL remain unchanged

#### Scenario: Invalid test visibility value
- **WHEN** a lesson owner calls `updateLesson` with `testVisibility: "everything"`
- **THEN** the action SHALL fail validation and the lesson SHALL remain unchanged
