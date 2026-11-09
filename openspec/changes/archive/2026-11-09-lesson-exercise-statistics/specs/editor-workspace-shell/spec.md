## MODIFIED Requirements

### Requirement: Left rail provides navigation and drawers
The rail SHALL be a narrow vertical bar of icon buttons with short labels. It SHALL always include Back (to the page the workspace belongs to: problem list, contest page, or lesson roadmap), Submissions (opens the history drawer) and Settings (editor font size and theme). Context items SHALL be added: Statistics and Tests for practice problems; the contest's problem letters (with solved marking) and Leaderboard for contests; previous/next exercise and Statistics for lessons. Drawers SHALL open over the workspace without unmounting the editor, so code is never lost.

#### Scenario: Back from a contest problem
- **WHEN** a participant clicks Back on a contest problem
- **THEN** they return to the contest page

#### Scenario: Switch contest problem from the rail
- **WHEN** a participant clicks letter C in the rail
- **THEN** the workspace shows problem C, with the editor holding problem C's saved draft for the selected language

#### Scenario: Drawer keeps code
- **WHEN** a student types code, opens the Submissions drawer and closes it
- **THEN** the editor still contains the typed code with its undo history

### Requirement: Lesson exercise workspace
The lesson exercise page SHALL use the shell with: Back to the lesson roadmap, previous/next exercise in the rail, a Statistics drawer, a "completed" status in the top bar when the exercise is done, Submit/Run sending the answer in the exercise's mode (code, blocks or parsons), and history from the exercise's own submissions.

#### Scenario: Next exercise
- **WHEN** a student clicks Next in the rail
- **THEN** the next exercise of the lesson opens in the same shell

## ADDED Requirements

### Requirement: Lesson exercise statistics are class-scoped for teachers
The lesson exercise Statistics drawer SHALL show solved-by count, attempted-by count and success rate (solved-by divided by attempted-by). For a user who manages the class (owner, co-teacher or admin) the counts SHALL include only submissions made to this exercise by the class's students (the owner and co-teachers are never counted), CANCELED submissions SHALL NOT count as attempts, and the drawer SHALL also show the class's student count and label the numbers as this class's. For any other class member the drawer SHALL show the problem-wide statistics, the same as the problem page's Statistics drawer, labelled as all users. Only class members SHALL be able to fetch an exercise's statistics.

#### Scenario: Teacher sees class numbers
- **WHEN** a teacher opens the Statistics drawer of an exercise where 3 of the class's 20 students have a PASSED submission to that exercise and 5 have a non-canceled submission
- **THEN** the drawer SHALL show solved by 3, attempted by 5, success rate 60.00%, 20 students, labelled as this class

#### Scenario: Teacher's own test submission not counted
- **WHEN** a teacher submits a passing solution to their own exercise and opens the Statistics drawer
- **THEN** the solved-by and attempted-by counts SHALL NOT include the teacher

#### Scenario: Practice and other-class submissions excluded for teachers
- **WHEN** a student of the class solved the same problem on the standalone problem page or in another class's exercise, but has no submission to this exercise
- **THEN** that student SHALL NOT be counted in the teacher's exercise statistics

#### Scenario: Student sees global numbers
- **WHEN** a student opens the Statistics drawer of an exercise
- **THEN** the drawer SHALL show the same solved-by, attempted-by and success rate as the problem page, labelled as all users

#### Scenario: Non-member denied
- **WHEN** a user who is not a member of the class requests the exercise's statistics
- **THEN** the request SHALL fail without returning any counts
