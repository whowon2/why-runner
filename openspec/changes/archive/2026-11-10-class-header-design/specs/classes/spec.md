## ADDED Requirements

### Requirement: Class detail header layout
The class detail page SHALL render the class name, icon badge and student count through the shared `PageHeader` with no inline actions, so the name uses the full content width. Teacher actions SHALL appear in a toolbar row below the header: a compact copyable class-code chip, a Gradebook link, a primary (filled) Create assignment button, and an overflow menu holding Edit class, Leave class (co-teachers only) and Delete class (owner-level only, destructive style). Members without manage rights SHALL see only a Leave class action in that toolbar. The header and toolbar SHALL NOT overflow the content width at any viewport width down to 360px.

#### Scenario: Long class name wraps at full width
- **WHEN** a teacher opens a class named "Programação 1 - TecInfo1 - 2026" on a desktop viewport
- **THEN** the name renders on one line (or wraps across the full content width), not word by word in a narrow column

#### Scenario: Destructive actions live in the overflow menu
- **WHEN** the class owner opens the class detail page
- **THEN** no Delete class button is visible in the toolbar, and opening the ellipsis menu shows Edit class and a destructive-styled Delete class item that opens the existing confirmation dialog

#### Scenario: Copy class code from the chip
- **WHEN** a teacher clicks the class-code chip
- **THEN** the join code is copied to the clipboard and a confirmation toast appears

#### Scenario: Mobile width has no horizontal overflow
- **WHEN** the page is viewed at 375px wide
- **THEN** the toolbar wraps onto extra lines and the document has no horizontal scroll
