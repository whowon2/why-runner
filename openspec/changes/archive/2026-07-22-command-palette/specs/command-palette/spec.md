## ADDED Requirements

### Requirement: Global keyboard invocation
The system SHALL open the command palette from any page when the user presses `Cmd+K` (macOS) or `Ctrl+K` (other platforms), unless the keyboard focus is inside a text-editing context that already consumes the combo.

#### Scenario: Opening from any route
- **WHEN** the user presses `Ctrl+K`/`Cmd+K` while on any `[locale]`-scoped page
- **THEN** the command palette opens as a centered overlay with a search input focused

#### Scenario: Toggling closed
- **WHEN** the palette is open and the user presses `Esc`, clicks outside the palette, or presses `Ctrl+K`/`Cmd+K` again
- **THEN** the palette closes and focus returns to the previously focused element

### Requirement: Fuzzy command search
The system SHALL filter the visible command list as the user types, matching against each command's label and optional keywords, case-insensitively.

#### Scenario: Filtering narrows results
- **WHEN** the user types a query that matches a subset of command labels/keywords
- **THEN** only matching commands remain visible, grouped under their existing group headings

#### Scenario: No matches
- **WHEN** the user's query matches no command
- **THEN** the palette shows an empty-state message instead of an empty list

### Requirement: Keyboard navigation and selection
The system SHALL let the user navigate and select commands entirely via keyboard.

#### Scenario: Arrow key navigation
- **WHEN** the palette is open with a filtered list of commands
- **THEN** pressing Arrow Down/Up moves the highlighted selection to the next/previous visible command, wrapping at the ends

#### Scenario: Selecting a command
- **WHEN** a command is highlighted and the user presses `Enter`, or clicks the command
- **THEN** the command's action executes and the palette closes (unless the command opens a nested sub-list, e.g. theme selection)

### Requirement: Navigation commands
The system SHALL provide commands that route the user to each top-level page (home, problems, contests, roadmap, settings, profile) using locale-aware navigation.

#### Scenario: Navigating to a page
- **WHEN** the user selects a navigation command (e.g. "Go to Problems")
- **THEN** the app navigates to that route under the current locale and the palette closes

### Requirement: Create-action commands
The system SHALL provide commands that launch the existing "create problem" and "create contest" flows.

#### Scenario: Creating a problem
- **WHEN** the user selects "New problem"
- **THEN** the app navigates to the existing problem-creation page

#### Scenario: Creating a contest
- **WHEN** the user selects "New contest"
- **THEN** the app opens the existing contest-creation dialog

### Requirement: Account commands
The system SHALL provide a "Log out" command that signs the current user out, visible only to authenticated users.

#### Scenario: Logging out via palette
- **WHEN** an authenticated user selects "Log out"
- **THEN** the app invokes the existing sign-out flow and the palette closes

#### Scenario: Hidden when unauthenticated
- **WHEN** no user session is present
- **THEN** the "Log out" command does not appear in the palette

### Requirement: Theme switch sub-list
The system SHALL let the user change the app's appearance theme from within the palette without leaving it.

#### Scenario: Switching theme inline
- **WHEN** the user selects "Change theme"
- **THEN** the palette shows the available themes as a nested list, and selecting one applies it immediately via the existing theme-customization mechanism

### Requirement: Localized labels
The system SHALL render all command labels and palette UI text through the app's i18n system, in the user's active locale.

#### Scenario: Locale-specific rendering
- **WHEN** the active locale is `br`
- **THEN** all command labels and palette placeholder/empty-state text render in the `br` translation strings
