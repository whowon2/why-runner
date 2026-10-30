## MODIFIED Requirements

### Requirement: Professor-only exercise similarity report
`getExerciseSimilarity` SHALL authenticate the caller, parse its input with a zod schema (`exerciseId` uuid, `pick` enum), and throw unless the caller is a manager (owner, co-teacher or admin) of the class the exercise's lesson belongs to. It SHALL compare submissions whose `exerciseId` is that exercise, excluding submissions by the class owner and co-teachers. It SHALL return a `PARSONS_NOT_SUPPORTED` action failure for `parsons` exercises (every answer is a reordering of the same lines). It SHALL return students with `publicUserColumns` only, each picked submission's id, language, status, created time and `code`, and SHALL NOT return `submission.output`. Nothing SHALL be written to the database.

#### Scenario: Student calls the action
- **WHEN** a class member with role `student` calls `getExerciseSimilarity`
- **THEN** the action SHALL throw and return no submissions

#### Scenario: Owner gets ranked pairs
- **WHEN** the class owner calls it for an exercise with submissions from 3 students in the same language
- **THEN** it SHALL return 3 pairs sorted by similarity descending, each with both students, both percentages and matched regions

#### Scenario: Co-teacher's test submission is ignored
- **WHEN** a co-teacher calls it and has also submitted to the exercise
- **THEN** the co-teacher's submission SHALL NOT appear in any pair

### Requirement: Professor-only contest problem similarity report
`getContestProblemSimilarity` SHALL authenticate the caller, parse `contestId`, `problemId` (uuid) and `pick` with zod, and throw unless the caller is the contest owner or an admin and the problem is attached to the contest. It SHALL compare submissions with that `contestId` and `problemId`, with the same picking, output and redaction rules as the exercise report.

#### Scenario: Non-owner calls the action
- **WHEN** a contest participant calls `getContestProblemSimilarity`
- **THEN** the action SHALL throw

#### Scenario: Admin calls the action
- **WHEN** an admin calls it for another user's contest
- **THEN** the action SHALL return the ranked pairs

#### Scenario: Problem not in contest
- **WHEN** the owner passes a `problemId` not attached to the contest
- **THEN** the action SHALL throw
