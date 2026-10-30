## ADDED Requirements

### Requirement: Class membership changes refresh every student-scoped view
Adding a co-teacher, changing a member's role, and removing a member SHALL invalidate the class queries (`["classes"]` prefix: class detail, class list, gradebook, lesson lists), lesson reviews (`["lessons"]`) and exercise similarity (`["exercises"]`), since each change moves a user in or out of the class's students.

#### Scenario: Owner promotes a student then opens the gradebook
- **WHEN** the owner makes a student a co-teacher and then opens the gradebook in the same session
- **THEN** the gradebook SHALL be refetched without that user's row

### Requirement: Admin role change refreshes the users list
Promoting or demoting a user on `/admin/users` SHALL invalidate the admin users queries (`["admin", "users"]`).

#### Scenario: Promote
- **WHEN** an admin promotes a user
- **THEN** the users list SHALL show that user's new role without a reload
