# user-preferences Specification

## Purpose
Defines per-account storage of user settings (color mode, theme, editor options) in the `user_preference` table, the localStorage mirror used for instant/pre-paint apply, seeding a new row from the browser, and the signed-out local-only fallback.
## Requirements
### Requirement: Per-account settings storage
The system SHALL store each signed-in user's settings in the database: color mode (light/dark), theme (preset id or custom light/dark token maps), editor font size, auto-close, vim keybindings, tab size, word wrap, line numbers and minimap. A setting with no stored value SHALL use its default. Notification preferences are out of scope and keep their own storage.

#### Scenario: Settings follow the account
- **WHEN** a student signed in on one computer picks the "dark" mode, a non-default preset and font size 18, then signs in on another computer
- **THEN** the second computer shows the same mode, preset and editor font size

#### Scenario: Defaults for unset values
- **WHEN** a signed-in user who never changed the tab size opens an editor
- **THEN** the editor uses the default tab size

### Requirement: Settings writes are validated and owner-only
The settings update action SHALL authenticate the caller, accept only the listed setting fields validated against their allowed values (e.g. font size 10–32, tab size 2/4/8, valid hex colors for custom tokens, known preset ids), and write only the caller's own row. Invalid input SHALL be rejected without changing stored values.

#### Scenario: Out-of-range value rejected
- **WHEN** a client calls the update action with font size 500
- **THEN** the action fails and the stored font size is unchanged

#### Scenario: Unauthenticated call
- **WHEN** a request without a session calls the update action
- **THEN** nothing is written

### Requirement: Local mirror for instant apply
For signed-in users, every settings change SHALL apply immediately in the current page and other open tabs and be written to `localStorage`, then saved to the database. On page load the stored `localStorage` values SHALL be applied first (before paint, for the theme), and once the database values arrive they SHALL replace the local values and be applied. A change the user makes before the database values arrive SHALL NOT be overwritten by them.

#### Scenario: No flash on a known device
- **WHEN** a signed-in user with a custom theme reloads a page on the same browser
- **THEN** the custom theme is applied before first paint

#### Scenario: New device converges
- **WHEN** a signed-in user opens the site on a browser with no stored settings
- **THEN** the defaults show first and the account's settings are applied as soon as they load, without a reload

#### Scenario: Local edit during load wins
- **WHEN** the user changes the font size before the database values have loaded
- **THEN** the new font size is kept and saved, not replaced by the older stored value

### Requirement: Seeding from the browser on first sign-in
When a signed-in user has no stored settings row, the system SHALL create it from the values currently in that browser's `localStorage` (only those that are present and valid), so existing users keep the settings they had before this change.

#### Scenario: Existing local settings are kept
- **WHEN** a user who had font size 20 and the "dark" mode in `localStorage` signs in for the first time after this change
- **THEN** their account stores font size 20 and dark mode, and other devices pick them up

### Requirement: Signed-out fallback
Signed-out visitors SHALL keep all settings in `localStorage` only, as before, with no server calls for settings.

#### Scenario: Visitor changes the mode
- **WHEN** a signed-out visitor toggles light mode and reloads
- **THEN** light mode is kept and no settings request is sent to the server

### Requirement: Saving failures don't lose the change
If saving a change to the database fails, the change SHALL remain applied and stored locally for the current browser, and the user SHALL be told it wasn't saved to the account.

#### Scenario: Network error on save
- **WHEN** the save request fails after the user enables vim
- **THEN** vim stays on in this browser and an error toast says the setting wasn't saved

