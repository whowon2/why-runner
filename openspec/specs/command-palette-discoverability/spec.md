# command-palette-discoverability Specification

## Purpose
How the UI advertises and exposes the command palette: dock trigger, shortcut hint, platform-specific key label.
## Requirements
### Requirement: Dock exposes a command palette trigger
The dock SHALL render a command palette trigger button for every visitor, whether or not they have an active session. Activating the trigger (click, tap, or Enter/Space when focused) MUST open the command palette. The trigger MUST have an accessible name equal to the localized palette label.

#### Scenario: Signed-out visitor opens the palette from the dock
- **WHEN** a visitor without a session clicks the palette trigger in the dock
- **THEN** the command palette opens

#### Scenario: Signed-in user opens the palette from the dock
- **WHEN** a signed-in user clicks the palette trigger in the dock
- **THEN** the command palette opens

#### Scenario: Touch device without keyboard
- **WHEN** a visitor on a phone taps the palette trigger
- **THEN** the command palette opens

#### Scenario: Keyboard activation
- **WHEN** a keyboard user focuses the palette trigger and presses Enter
- **THEN** the command palette opens

### Requirement: Trigger advertises the keyboard shortcut
Hovering or focusing the palette trigger SHALL show a tooltip containing the localized palette label and the keyboard shortcut rendered as keycaps. The shortcut label MUST be `⌘ K` on Apple platforms (macOS, iOS, iPadOS) and `Ctrl K` on all other platforms.

#### Scenario: Tooltip on macOS
- **WHEN** a visitor on macOS hovers the palette trigger
- **THEN** the tooltip shows the palette label and the keycaps `⌘` `K`

#### Scenario: Tooltip on Windows or Linux
- **WHEN** a visitor on Windows or Linux hovers the palette trigger
- **THEN** the tooltip shows the palette label and the keycaps `Ctrl` `K`

#### Scenario: Tooltip is localized
- **WHEN** a visitor viewing the site in Portuguese hovers the palette trigger
- **THEN** the tooltip label is in Portuguese

### Requirement: Trigger and shortcut share palette state
The dock trigger and the Ctrl+K / ⌘K shortcut SHALL control the same palette instance, so opening via one and closing via the other works, and the existing shortcut behavior is unchanged.

#### Scenario: Open by click, close by shortcut
- **WHEN** a visitor opens the palette via the dock trigger and then presses Ctrl+K / ⌘K
- **THEN** the palette closes

#### Scenario: Shortcut still works
- **WHEN** a visitor presses Ctrl+K / ⌘K outside an editable field
- **THEN** the palette toggles as before
