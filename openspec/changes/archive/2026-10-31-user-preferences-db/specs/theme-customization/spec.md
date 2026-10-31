## MODIFIED Requirements

### Requirement: Client-side theme persistence
The system SHALL persist the active theme selection (preset id, or full custom token map) and the light/dark mode. For signed-in users they SHALL be saved to the account (see `user-preferences`) and mirrored in the browser's `localStorage`; for signed-out visitors they SHALL be stored in `localStorage` only. On page load the `localStorage` copy SHALL be applied before first paint, avoiding a visible flash of a different theme. Temporary previews (command palette preset or mode preview) SHALL NOT be saved.

#### Scenario: Preset persists across reload
- **WHEN** a user selects a non-default preset and reloads the page
- **THEN** the same preset is active immediately after reload, with no visible flash of the default preset

#### Scenario: Custom theme persists across reload
- **WHEN** a user edits and applies a custom theme and reloads the page
- **THEN** the same custom color values are restored and applied immediately after reload

#### Scenario: Theme follows the account
- **WHEN** a signed-in user selects a preset and later signs in on a new browser
- **THEN** that preset is applied once the account's settings load

#### Scenario: New browser/device sees the default theme
- **WHEN** a signed-out visitor with no prior localStorage entry (new browser, cleared storage) loads any page
- **THEN** the default "linux rice" preset is applied

#### Scenario: Preview not saved
- **WHEN** a signed-in user hovers presets in the command palette and closes it without choosing one
- **THEN** the account's saved theme is unchanged
