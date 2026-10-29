# lesson-exercise-picker Specification

## Purpose
Defines the searchable problem picker shared by lessons and contests (server search by title or code, showing code, author and difficulty) and which problems a teacher may add to a lesson.
## Requirements
### Requirement: Searchable problem picker shared by lessons and contests
Adding an exercise to a lesson SHALL use the same problem picker component as adding a problem to a contest: a combobox with a search box that queries the server by title or problem code (debounced), listing each result with its code, title, author name and difficulty. Problems already in the lesson (or contest) SHALL be left out of the results. Selecting a result SHALL add it immediately.

#### Scenario: Search by code
- **WHEN** a teacher types a problem code in the lesson's "Add exercise" picker
- **THEN** the matching problem is listed first with its code, title, author and difficulty, and clicking it adds it to the lesson

#### Scenario: Already-added problems hidden
- **WHEN** the teacher opens the picker on a lesson that already contains problem P
- **THEN** P is not offered

#### Scenario: Contest picker shows difficulty
- **WHEN** a contest owner opens the contest problem picker
- **THEN** each result also shows its difficulty

### Requirement: Lesson picker offers every problem the teacher can see
The lesson picker SHALL search all published problems plus the teacher's own drafts, not only the teacher's first 50 problems. The server SHALL reject adding a problem that is neither published nor owned by the lesson owner.

#### Scenario: Another author's published problem
- **WHEN** a teacher searches for a published problem written by someone else
- **THEN** it is listed and can be added to the lesson

#### Scenario: Someone else's draft by id
- **WHEN** a client calls the add-exercise action with the id of another user's draft problem
- **THEN** the action fails with "Problem not found" and no exercise is created

