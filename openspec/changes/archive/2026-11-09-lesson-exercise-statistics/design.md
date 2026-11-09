## Context

`getProblemStatistics(problemId)` counts distinct users with a PASSED / non-CANCELED submission to the problem, across every context (practice, contests, every class). The problem workspace shows it in a Statistics drawer (`ProblemStatisticsTab`). The lesson exercise workspace (`exercise-workspace.tsx`) has only previous/next in its rail. Submissions made through an exercise carry `submission.exerciseId`; class roles come from `getClassAccess` (`canManage` = owner, co-teacher or admin) and `classStaffIds` lists the owner plus co-teachers.

## Goals / Non-Goals

**Goals:**
- Statistics drawer in the exercise workspace.
- Teachers see how *their class* does on *this exercise*.
- Reuse the existing table so both drawers look the same.

**Non-Goals:**
- Per-student breakdown (that's the gradebook / lesson review).
- Class-scoped numbers for students (instruction scoped the class view to teachers; students keep the familiar global numbers).
- Caching or materialized counts.

## Decisions

- **One action, scope chosen server-side.** `getExerciseStatistics(exerciseId)` loads the exercise + lesson + classroom, calls `assertClassMember`, and branches on `access.canManage`. Returns `{ scope: "class" | "global", solvedByCount, attemptedByCount, successRate, studentCount | null }`. The client never picks the scope, so a student can't request class data. Alternative (two actions, client picks by role) rejected: duplicated auth and a client-trusted switch.
- **Class scope = this exercise's submissions by current student members.** Filter `submission.exerciseId = id` and `userId IN (classroom_membership where role = 'student')` minus `classStaffIds`. `exerciseId` (not `problemId` + class) because the same problem can back several exercises and practice; this matches how `getExercise`/`getExerciseSubmissions` scope "done". Students who left the class drop out, matching the gradebook's roster. `studentCount` = current student members (minus staff), giving context for "solved by N".
- **Global scope reuses `getProblemStatistics`** logic (call the function directly) so the student's numbers equal the problem page's.
- **Shared `StatisticsTable`** presentational component (in the problems workspace statistics file) taking the stats and an optional scope note; `ProblemStatisticsTab` and new `ExerciseStatisticsTab` both render it.
- **Query key `["problem-statistics", "exercise", exerciseId]`** so the existing `["problem-statistics"]` prefix invalidation in `use-cancel-submission` also hits it; `use-create-exercise-submission` additionally invalidates it. Judge verdicts land asynchronously; the drawer refetches on open (staleTime 0), which is enough.

## Risks / Trade-offs

- [Two extra queries per drawer open] → small count queries on indexed columns; only run when the drawer is open.
- [Admin who is also not a member sees class scope] → intended: admins manage every class.
- [Student vs teacher see different numbers for the same exercise] → drawer labels the scope ("this class" / "all users").
