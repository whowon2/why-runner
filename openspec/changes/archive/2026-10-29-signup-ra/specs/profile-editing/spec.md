## MODIFIED Requirements

### Requirement: Edit form covers username, bio, location, website
Activating the edit control SHALL open a form pre-filled with the owner's current `username`, `ra`, `bio`, `location`, and `website` values. Each is editable and independently optional, except `username`. The `ra` field SHALL accept exactly 7 digits and keep leading zeros (a text input, not a numeric one).

#### Scenario: Form opens pre-filled
- **WHEN** the owner activates the edit control
- **THEN** a form opens with `username`, `ra`, `bio`, `location`, and `website` fields populated with the user's current stored values (empty if unset)

#### Scenario: Optional fields may be cleared
- **WHEN** the owner clears the `ra`, `bio`, `location`, or `website` field and saves
- **THEN** the corresponding value is persisted as empty/null without error

### Requirement: Saving edits persists and reflects immediately
Submitting the form SHALL validate and persist all five fields via the `updateProfile` server action. On success, the profile page SHALL reflect the new values without a full page reload. Username and RA duplicate checks SHALL follow `user-identity` (case-insensitive for username, excluding the owner's own row).

#### Scenario: Successful save
- **WHEN** the owner submits valid changes to any of `username`, `ra`, `bio`, `location`, `website`
- **THEN** the values are persisted, a success confirmation is shown, and the profile card updates to show the new values

#### Scenario: Duplicate username rejected
- **WHEN** the owner submits a `username` that equals another user's username ignoring case
- **THEN** the save is rejected with an error message and no fields are persisted

#### Scenario: Duplicate RA rejected
- **WHEN** the owner submits an `ra` already registered to another user
- **THEN** the save is rejected with an error message and no fields are persisted

#### Scenario: Invalid website rejected
- **WHEN** the owner submits a non-empty `website` value that is not a valid URL
- **THEN** the form shows a validation error and the save is not submitted
