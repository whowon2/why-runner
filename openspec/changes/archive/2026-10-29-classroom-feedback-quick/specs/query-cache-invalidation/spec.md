## MODIFIED Requirements

### Requirement: Class gradebook refreshes when its inputs change
Mutations that change which lessons/exercises a class gradebook lists, or which lessons a student has handed in, SHALL invalidate the class queries: publishing/unpublishing a lesson, adding, moving or removing a lesson exercise, updating or deleting a lesson, removing a member, and submitting a lesson. Lesson update, publish and delete mutations SHALL invalidate only that lesson's class (`["classes", classroomId]` prefix, which covers `["classes", classroomId, "gradebook"]` and `["classes", classroomId, "lessons"]`), falling back to the `["classes"]` prefix only when the class id is unknown. Other mutations in this list MAY keep invalidating the `["classes"]` prefix.

#### Scenario: Professor publishes a lesson then opens the gradebook
- **WHEN** the class owner publishes a lesson and then navigates to the class gradebook in the same session
- **THEN** the gradebook SHALL be refetched and include that lesson's exercise columns

#### Scenario: Professor adds an exercise to a published lesson
- **WHEN** the class owner adds an exercise to a published lesson
- **THEN** any cached gradebook for that class SHALL be invalidated so the new column appears

#### Scenario: Lesson update leaves other classes alone
- **WHEN** the class owner changes a lesson's due date in class A while class B's queries are cached
- **THEN** class A's queries are invalidated and class B's queries are not

## ADDED Requirements

### Requirement: Lesson settings update optimistically
Lesson update and publish mutations SHALL write the new values into the cached `["lessons", lessonId]` data before the server responds, roll that cache back and show an error toast if the server rejects the change, and refetch `["lessons", lessonId]` once the mutation settles. Exercise queries (`["exercises", …]`), which carry the lesson's due date and output visibility, SHALL be marked stale without being refetched immediately; they refetch when next shown.

#### Scenario: Toggling a lesson setting
- **WHEN** the lesson owner flips a lesson setting switch (e.g. show expected outputs)
- **THEN** the switch shows the new state immediately, and at most the lesson query and that class's active queries are refetched

#### Scenario: Server rejects the change
- **WHEN** the update fails (e.g. the session expired)
- **THEN** the setting returns to its previous value and an error toast is shown

#### Scenario: Student exercise page after a change
- **WHEN** the owner changes the due date and then opens one of the lesson's exercises in the same session
- **THEN** the exercise page shows the new due date
