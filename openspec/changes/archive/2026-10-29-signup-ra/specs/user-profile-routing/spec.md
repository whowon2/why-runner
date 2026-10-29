## MODIFIED Requirements

### Requirement: Public profile route addressed by username
The system SHALL provide a profile route addressed by a user's `username` (e.g. `/user/[username]`), rendering that user's profile to any visitor, distinct from the existing self-only profile page. The username in the route SHALL match case-insensitively, and the profile SHALL display the username with its stored case.

#### Scenario: Visiting another user's profile by username
- **WHEN** a user navigates to the profile route for another user's `username`
- **THEN** that user's profile (info card, tabs, etc.) renders

#### Scenario: Username in a different case
- **WHEN** a user navigates to `/user/anasilva` and the stored username is `AnaSilva`
- **THEN** `AnaSilva`'s profile renders, showing the username as `AnaSilva`

#### Scenario: Unknown username
- **WHEN** a user navigates to the profile route with a `username` that does not exist in any case
- **THEN** the system SHALL treat it as not found
