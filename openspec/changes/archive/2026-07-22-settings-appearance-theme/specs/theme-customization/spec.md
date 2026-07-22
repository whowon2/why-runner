## ADDED Requirements

### Requirement: Settings page with Appearance section
The system SHALL provide a `/settings` page, reachable only by authenticated users, containing an Appearance section that hosts theme selection.

#### Scenario: Authenticated user opens settings
- **WHEN** an authenticated user navigates to `/settings`
- **THEN** the page renders and shows an Appearance section for theme selection

#### Scenario: Unauthenticated user is redirected
- **WHEN** an unauthenticated visitor navigates to `/settings`
- **THEN** they are redirected to sign-in, consistent with other authenticated pages using `getCurrentUser()`

### Requirement: Preset vs custom theme mode toggle
The Appearance section SHALL offer a segmented control with two mutually exclusive modes, "preset" and "custom," and SHALL show only the UI for the active mode.

#### Scenario: Switching to custom mode
- **WHEN** the user clicks the "custom" segment while "preset" is active
- **THEN** the preset grid is hidden and the custom color-token editor is shown, and the segmented control reflects "custom" as active

### Requirement: Preset theme picker
The system SHALL display a grid of named preset themes, each rendered as a labeled swatch using that preset's own background/foreground colors, and SHALL apply a preset immediately on click without a page reload.

#### Scenario: Selecting a preset
- **WHEN** the user clicks a preset swatch (e.g. "linux rice")
- **THEN** the site's color tokens update immediately to that preset's values and the swatch is visually marked as selected

#### Scenario: Preset respects light/dark mode
- **WHEN** a preset is active and the user toggles light/dark mode via the existing dock control
- **THEN** the preset's light or dark token set is applied to match, without changing which preset is selected

### Requirement: Custom theme editor
The system SHALL provide a form of labeled color-token fields (at minimum: background, main/primary, text, sub, caret, error), each editable via a hex text input paired with a native color-swatch picker, and SHALL apply edits live as the user types or picks a color.

#### Scenario: Editing a token live-updates the site
- **WHEN** the user changes the "main" color field's value to a new valid hex color
- **THEN** the site's corresponding accent/primary color updates immediately, without requiring a save action

#### Scenario: Invalid hex value is rejected
- **WHEN** the user types a value into a color field that is not a valid hex color
- **THEN** the invalid value is not applied to the site's color tokens, and the field indicates the value is invalid

### Requirement: Client-side theme persistence
The system SHALL persist the active theme selection (preset id, or full custom token map) in the browser's localStorage, and SHALL restore it on subsequent page loads before first paint, avoiding a visible flash of a different theme.

#### Scenario: Preset persists across reload
- **WHEN** a user selects a non-default preset and reloads the page
- **THEN** the same preset is active immediately after reload, with no visible flash of the default preset

#### Scenario: Custom theme persists across reload
- **WHEN** a user edits and applies a custom theme and reloads the page
- **THEN** the same custom color values are restored and applied immediately after reload

#### Scenario: New browser/device sees the default theme
- **WHEN** a user with no prior localStorage entry (new browser, cleared storage) loads any page
- **THEN** the default "linux rice" preset is applied
