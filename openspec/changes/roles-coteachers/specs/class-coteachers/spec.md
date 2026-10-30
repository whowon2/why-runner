## ADDED Requirements

### Requirement: Membership role
Every class membership SHALL have a `role` of `student` or `teacher`, defaulting to `student`. A member with role `teacher` is a co-teacher. The class owner remains `classroom.createdBy`; if the owner holds a membership row it SHALL have role `teacher`.

#### Scenario: Joining by code
- **WHEN** a user joins a class with its join code
- **THEN** their membership has role `student`

#### Scenario: Co-teacher re-enters the join code
- **WHEN** a co-teacher joins the same class again by code
- **THEN** their role stays `teacher`

### Requirement: Class permission matrix
The system SHALL resolve each user's relation to a class as `owner`, `teacher`, `student`, `admin` or none, and SHALL grant:
- class managers (`owner`, `teacher`, `admin`): view all lessons including drafts; create, edit, publish, unpublish and delete lessons; add, reorder and remove exercises; set exercise modes and Parsons solutions; manage structural and algorithm constraints; view the gradebook; export results; view similarity reports; view exercise submissions and lesson reviews; review and leave feedback; rename the class; see the full roster; remove students.
- owner-level (`owner`, `admin`): everything managers can, plus delete the class, add co-teachers, promote or demote members, and remove co-teachers.
- `student`: view published lessons and submit.
Every class and lesson action and page SHALL decide access through this resolution, not by comparing `classroom.createdBy` or `lesson.createdBy` inline. Lesson management SHALL be decided by the lesson's class.

#### Scenario: Co-teacher edits the owner's lesson
- **WHEN** a co-teacher updates a lesson the owner created
- **THEN** the update succeeds

#### Scenario: Co-teacher creates a lesson
- **WHEN** a co-teacher creates a lesson
- **THEN** the lesson is created with `createdBy` = the co-teacher and the owner can manage it too

#### Scenario: Co-teacher reviews a submission
- **WHEN** a co-teacher leaves feedback on a student's submitted lesson
- **THEN** the feedback is saved

#### Scenario: Co-teacher tries to delete the class
- **WHEN** a co-teacher calls `deleteClass`
- **THEN** the action is rejected and nothing is deleted

#### Scenario: Student tries a manager action
- **WHEN** a student calls `createLesson` for their class
- **THEN** the action is rejected

### Requirement: Owner manages co-teachers
The owner (or an admin) SHALL be able to add an existing user as co-teacher by exact username or email, which creates or upgrades their membership to `teacher`, and to change any member's role between `student` and `teacher`. Unknown users SHALL get a generic not-found error. Co-teachers and students SHALL NOT be able to add, promote, demote or remove co-teachers. The owner's own relation SHALL NOT be changeable.

#### Scenario: Invite by username
- **WHEN** the owner adds `maria` as co-teacher and `maria` is not a member
- **THEN** `maria` gets a `teacher` membership and sees the class as taught

#### Scenario: Promote a student
- **WHEN** the owner promotes a current student
- **THEN** that membership's role becomes `teacher` and they leave the student roster

#### Scenario: Co-teacher tries to add another co-teacher
- **WHEN** a co-teacher calls the add-co-teacher action
- **THEN** the action is rejected

#### Scenario: Unknown user
- **WHEN** the owner adds an email that matches no user
- **THEN** the action fails with "user not found" and no row is written

### Requirement: Co-teacher UI
The class page SHALL show the roster split into teachers (owner first, then co-teachers) and students to managers. Owner-level users SHALL see a control to add a co-teacher by username or email, and per-member actions to promote to teacher, demote to student and remove. Co-teachers SHALL see the remove action only on students. Delete-class SHALL be shown only to owner-level users.

#### Scenario: Co-teacher views roster
- **WHEN** a co-teacher opens the class page
- **THEN** they see teachers and students, a remove action on students only, and no add-co-teacher or delete-class control

### Requirement: Staff are not students
Co-teachers and the owner SHALL be excluded from every set of class students: roster count, gradebook rows, results export rows, lesson review lists, similarity comparisons, and home-page pending lessons. Admins who are not members SHALL never be counted as students.

#### Scenario: Gradebook with a co-teacher
- **WHEN** a class has 3 students and 1 co-teacher
- **THEN** the gradebook has 3 rows

#### Scenario: Co-teacher home page
- **WHEN** a co-teacher opens home while the class has a published lesson
- **THEN** that lesson is not listed as pending for them

### Requirement: Taught classes in the class list
The class list SHALL show a "taught" group containing classes the user owns and classes where they are a co-teacher (each marked owner or co-teacher), and a "joined" group with classes where they are a student.

#### Scenario: Co-teacher's class list
- **WHEN** a user is co-teacher of class A and student of class B
- **THEN** A is listed under taught marked co-teacher and B under joined
