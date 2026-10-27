## ADDED Requirements

### Requirement: Class gradebook refreshes when its inputs change
Mutations that change which lessons/exercises a class gradebook lists, or which lessons a student has handed in, SHALL invalidate the class queries (`["classes"]` prefix, which covers `["classes", classroomId, "gradebook"]`): publishing/unpublishing a lesson, adding, moving or removing a lesson exercise, updating or deleting a lesson, removing a member, and submitting a lesson.

#### Scenario: Professor publishes a lesson then opens the gradebook
- **WHEN** the class owner publishes a lesson and then navigates to the class gradebook in the same session
- **THEN** the gradebook SHALL be refetched and include that lesson's exercise columns

#### Scenario: Professor adds an exercise to a published lesson
- **WHEN** the class owner adds an exercise to a published lesson
- **THEN** any cached gradebook for that class SHALL be invalidated so the new column appears
