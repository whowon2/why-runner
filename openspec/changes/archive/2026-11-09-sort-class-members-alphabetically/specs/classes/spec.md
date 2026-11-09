## ADDED Requirements

### Requirement: Class roster is ordered by name, teachers first
For class managers, the class page SHALL list the class's teachers before its students: the owner first, then co-teachers, then students. Co-teachers and students SHALL each be ordered by name using pt-BR collation that ignores case and accents, with ties broken by username. Join date SHALL NOT affect the order.

#### Scenario: Students listed alphabetically regardless of join order
- **WHEN** students "Zé", "ana" and "Álvaro" joined a class in that order
- **THEN** the students list SHALL show "Álvaro", "ana", "Zé"

#### Scenario: Teachers listed before students
- **WHEN** a class has an owner, co-teacher "Bruno" and student "Ana"
- **THEN** the owner and "Bruno" SHALL appear in the teachers list above the students list containing "Ana"

#### Scenario: Same name tiebreak
- **WHEN** two students are both named "Maria Silva" with usernames `msilva2` and `msilva1`
- **THEN** `msilva1` SHALL be listed before `msilva2`
