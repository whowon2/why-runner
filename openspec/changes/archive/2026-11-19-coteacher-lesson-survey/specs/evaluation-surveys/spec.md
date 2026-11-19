## MODIFIED Requirements

### Requirement: Eligibility
The system SHALL check eligibility on the server both when rendering a survey and when accepting a submission:
- `contest_author`: the user is the contest's `createdBy` and the contest is `published` with at least one problem.
- `contest_participant`: the user has an `accepted` `userOnContest` row for the contest and at least one submission in it.
- `lesson_author`: the user teaches the lesson's class — they are the class owner (`classroom.createdBy`) or have a `teacher` membership in it — the lesson is published, and it has at least one exercise. Who created the lesson SHALL NOT matter on its own, and a platform admin with no such relation SHALL NOT be eligible. Each teacher of the class answers independently.
- `lesson_student`: the user has a `lessonSubmission` row for the lesson.

#### Scenario: Ineligible user calls the submit action directly
- **WHEN** a user who never joined a contest POSTs a `contest_participant` submission for it
- **THEN** the action rejects it and no row is written

#### Scenario: Professor opens the student form for their own lesson
- **WHEN** a teacher of the lesson's class opens `/surveys/lesson_student/{lessonId}` without a lesson submission of their own
- **THEN** the page explains they are not eligible for this form and links to the `lesson_author` form instead

#### Scenario: Co-teacher answers the teacher form for a lesson the owner created
- **WHEN** a co-teacher of a class opens `/surveys/lesson_author/{lessonId}` for a published lesson with an exercise that the class owner created
- **THEN** the questionnaire renders and their submission is accepted

#### Scenario: Owner and co-teacher both answer
- **WHEN** the class owner and a co-teacher each submit the `lesson_author` form for the same lesson
- **THEN** both responses are stored, one per user

#### Scenario: Removed co-teacher
- **WHEN** a user whose `teacher` membership was removed from the class opens the `lesson_author` form for one of its lessons
- **THEN** the page explains they are not eligible and the submit action rejects their answers

#### Scenario: Admin outside the class
- **WHEN** a platform admin who neither owns nor co-teaches the class opens the `lesson_author` form for one of its lessons
- **THEN** the page explains they are not eligible

### Requirement: Survey hub and entry points
The system SHALL provide a `/surveys` page listing every form × entity the current user is eligible for, split into pending and answered. The contest page SHALL show a survey call-to-action card to an eligible user who has not answered, only after the contest's `endDate`. The lesson page SHALL show the card to an eligible student after they submit the lesson, and to every teacher of the lesson's class (owner and co-teachers) who has not answered once the lesson has at least one student submission. The card SHALL be dismissible for the current session without affecting eligibility.

#### Scenario: Live contest
- **WHEN** an eligible participant views a contest that has not ended
- **THEN** no survey card is shown on the contest page

#### Scenario: Student just submitted the lesson
- **WHEN** a student submits a lesson to the professor and returns to the lesson page
- **THEN** a card invites them to the `lesson_student` survey for that lesson

#### Scenario: Co-teacher sees the lesson card
- **WHEN** a co-teacher opens a published lesson of their class that has at least one student submission and they have not answered `lesson_author` for it
- **THEN** a card invites them to the `lesson_author` survey, and the lesson appears as pending in their `/surveys` hub

#### Scenario: Owner already answered
- **WHEN** the class owner has answered `lesson_author` for a lesson and the co-teacher has not
- **THEN** the co-teacher still sees the card and the owner does not
