## ADDED Requirements

### Requirement: Profile update refreshes every view of username and RA
Saving the profile (`updateProfile`) SHALL invalidate, from the mutation hook itself, the cached profile data and every cached query that shows the user's username or RA: class data (roster, gradebook), problem lists and contest data (creator links).

#### Scenario: Teacher sees a student's new RA
- **WHEN** a student sets their RA in the profile form while their class roster or gradebook is cached in the same browser
- **THEN** the next render of those views shows the new RA without a manual page refresh

#### Scenario: Profile card shows the new username
- **WHEN** the owner saves a new username
- **THEN** the profile card shows it without a full page reload
