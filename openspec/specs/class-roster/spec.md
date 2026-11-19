# class-roster Specification

## Purpose
How class managers see and manage a class's members: Lessons/People tabs, identifiable roster rows, counts and student search, one action menu per row, and a per-student side panel with scores and recent submissions.
## Requirements
### Requirement: Lessons and People tabs for class managers
For class managers (owner, co-teachers, admins), the class page SHALL show two tabs, "Lessons" and "People", where People also shows the student count. Lessons SHALL be selected by default. The selected tab SHALL be stored in the `tab` URL query parameter (`?tab=people`), so reloading the page or sharing the link keeps it. Students SHALL NOT see tabs: they see only the lessons, as before.

#### Scenario: Manager opens class page
- **WHEN** a co-teacher opens `/classes/<slug>` without a `tab` parameter
- **THEN** the Lessons tab is selected and the lesson cards are visible, with no roster above them

#### Scenario: People tab persists in URL
- **WHEN** the owner selects the People tab and reloads the page
- **THEN** the URL contains `?tab=people` and the People tab is still selected

#### Scenario: Student sees no tabs
- **WHEN** a student opens the class page
- **THEN** no Lessons/People tabs are shown and the lessons list is visible

### Requirement: Roster rows identify each member
Each roster row SHALL show the member's avatar (their profile image, or initials when they have none), name, and `@username`. Student rows SHALL also show the RA when it is set. The owner row SHALL carry an Owner badge and each co-teacher row a Co-teacher badge. Rows SHALL be visually separated (dividers) and highlighted on hover, so each row's actions read as part of that row.

#### Scenario: Student row without image
- **WHEN** a student with no profile image and RA `2023001` appears in the roster
- **THEN** their row shows their initials avatar, name, `@username` and `2023001`

### Requirement: Roster counts and student search
The Teachers and Students section headings SHALL show how many members each section has. The Students section SHALL have a search input that filters the list as the manager types. A student matches when the query is a case- and accent-insensitive substring of their name, their username (with or without a leading `@`), or their RA. When no student matches, the section SHALL say so. When the class has no students, the existing "no students yet" empty state SHALL be shown and the search SHALL be hidden.

#### Scenario: Search by RA
- **WHEN** the manager types `2023` in the student search
- **THEN** only students whose RA contains `2023` are listed

#### Scenario: Accent-insensitive search
- **WHEN** the manager types `joao` and the class has a student named "João"
- **THEN** "João" is listed

#### Scenario: No matches
- **WHEN** the query matches no student
- **THEN** the list shows a "no students match" message, and the Students heading still shows the class's total student count

### Requirement: Row action menu
Every member action SHALL live in one "⋯" menu per row, and the menu SHALL be shown only when the viewer has at least one action for that row. Owner-level users SHALL see "Make co-teacher" on student rows, "Make student" on co-teacher rows, and "Remove" on both. Co-teachers SHALL see only "Remove", and only on student rows. "Remove" SHALL ask for confirmation before removing the member. The owner row SHALL have no menu.

#### Scenario: Co-teacher menu on a student row
- **WHEN** a co-teacher opens a student row's menu
- **THEN** it contains only "Remove"

#### Scenario: Co-teacher sees no menu on teacher rows
- **WHEN** a co-teacher views the Teachers section
- **THEN** no row has an action menu

#### Scenario: Owner promotes a student
- **WHEN** the owner chooses "Make co-teacher" in a student's menu
- **THEN** the student moves to the Teachers section, both counts update, and a success toast is shown

### Requirement: Student side panel
Clicking a student row (anywhere except its action menu) SHALL open a side panel (sheet) for that student. The panel SHALL be full width on small screens. It SHALL show:
- the student's avatar, name, `@username` linking to their profile, RA when set, and the date they joined the class;
- their total score out of the maximum, and each published lesson's total with per-exercise scores, using the same numbers as the gradebook;
- their 10 most recent submissions to this class's lesson exercises, newest first, each with exercise title, lesson title, language, status badge and time, linking to the exercise page;
- a link to the class gradebook.

Submissions with status `CANCELED` SHALL be excluded. A lesson the student has not submitted SHALL appear as not submitted, not as zero.

#### Scenario: Open panel
- **WHEN** a manager clicks a student's row
- **THEN** a side panel opens with that student's header, total score, per-lesson scores and recent submissions

#### Scenario: Student with no submissions
- **WHEN** the panel opens for a student who has never submitted in this class
- **THEN** the recent submissions section shows an empty state

#### Scenario: Scores match the gradebook
- **WHEN** the panel shows lesson "Aula 1" total `1.50` for a student
- **THEN** the gradebook shows the same `1.50` for that student and lesson

### Requirement: Student submissions action is manager-only
The server action that lists a student's recent class submissions SHALL authenticate the caller and require them to be a class manager. It SHALL validate its input with zod (`classroomId` as a UUID, `userId` as a non-empty user id). It SHALL return only submissions to exercises in that class's lessons, by students of the class. It SHALL NOT return `submission.output` or code.

#### Scenario: Student calls the action
- **WHEN** a student of the class calls the action with a classmate's id
- **THEN** the action fails with a not-allowed error and returns no data

#### Scenario: Submission from another class
- **WHEN** the student also submitted to an exercise in another class
- **THEN** that submission is not in the result

