# profile-editing

## Purpose

Defines how a profile's owner edits their own profile (username, bio, location, website) from the profile page itself, and how those edits are validated, persisted, and reflected back on the page.

## Requirements

### Requirement: Owner-only edit entry point on profile page
The profile page SHALL render an "edit profile" control when the viewer is the profile's owner, and SHALL render no such control when the viewer is not the owner.

#### Scenario: Owner sees edit control
- **WHEN** the profile's owner views their own profile page
- **THEN** an edit-profile control is visible on the page

#### Scenario: Visitor does not see edit control
- **WHEN** a user who is not the profile's owner views that profile page
- **THEN** no edit-profile control is rendered

### Requirement: Edit form covers username, bio, location, website
Activating the edit control SHALL open a form pre-filled with the owner's current `username`, `bio`, `location`, and `website` values, each editable and independently optional except `username`.

#### Scenario: Form opens pre-filled
- **WHEN** the owner activates the edit control
- **THEN** a form opens with `username`, `bio`, `location`, and `website` fields populated with the user's current stored values (empty if unset)

#### Scenario: Optional fields may be cleared
- **WHEN** the owner clears the `bio`, `location`, or `website` field and saves
- **THEN** the corresponding value is persisted as empty/null without error

### Requirement: Saving edits persists and reflects immediately
Submitting the form SHALL validate and persist all four fields via the `updateProfile` server action, and on success the profile page SHALL reflect the new values without a full page reload.

#### Scenario: Successful save
- **WHEN** the owner submits valid changes to any of `username`, `bio`, `location`, `website`
- **THEN** the values are persisted, a success confirmation is shown, and the profile card updates to show the new values

#### Scenario: Duplicate username rejected
- **WHEN** the owner submits a `username` already taken by another user
- **THEN** the save is rejected with an error message and no fields are persisted

#### Scenario: Invalid website rejected
- **WHEN** the owner submits a non-empty `website` value that is not a valid URL
- **THEN** the form shows a validation error and the save is not submitted
