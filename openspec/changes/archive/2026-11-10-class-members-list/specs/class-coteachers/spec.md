## MODIFIED Requirements

### Requirement: Co-teacher UI
The class page SHALL show managers the roster in its People tab, split into teachers (owner first, then co-teachers) and students. Owner-level users SHALL see a control to add a co-teacher by username or email. Through each row's action menu, owner-level users SHALL be able to promote a member to teacher, demote them to student, and remove them. Co-teachers SHALL see the remove action only on students. Delete-class SHALL be shown only to owner-level users.

#### Scenario: Co-teacher views roster
- **WHEN** a co-teacher opens the class page's People tab
- **THEN** they see teachers and students, a remove action only in student rows' menus, and no add-co-teacher or delete-class control
