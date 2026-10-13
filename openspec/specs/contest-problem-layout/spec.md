## Purpose

Defines the layout of a contest's Problems tab: a wide, viewport-height statement/editor workspace with a resizable split on large screens and a stacked layout on narrow screens, so contestants get usable editor space for the whole contest.

## Requirements

### Requirement: Contest problem workspace uses available width
On a contest page's Problems tab, the workspace (problem letter selector, statement panel, and code editor panel) SHALL expand beyond the width cap used by the contest header and the other contest tabs, filling the viewport width minus page gutters up to a large maximum (at least 1600px). The Leaderboard, Settings, and Manage tabs SHALL keep their existing maximum width.

#### Scenario: Wide screen
- **WHEN** a participant opens the Problems tab on a viewport 1920px wide
- **THEN** the statement and editor panels together SHALL span substantially wider than 1152px (the previous `max-w-6xl` cap), leaving only page gutters on either side

#### Scenario: Other tabs unchanged
- **WHEN** the user switches to the Leaderboard, Settings, or Manage tab
- **THEN** that tab's content SHALL render at its previous maximum width

### Requirement: Statement and editor fill viewport height
On large screens (≥ 1024px wide), the statement/editor split SHALL have a height derived from the viewport (about one screen tall, with a minimum height floor), independent of statement length. The code editor SHALL fill the full height of its panel. When the statement and submissions content is taller than the panel, the statement panel SHALL scroll on its own without growing the page layout.

#### Scenario: Short statement
- **WHEN** a problem's statement is only a few lines long
- **THEN** the code editor SHALL still be about the height of the viewport, not limited to the statement's height

#### Scenario: Long statement
- **WHEN** a problem's statement plus submissions list is taller than the panel
- **THEN** the statement panel SHALL scroll on its own, and the editor panel SHALL keep its height and position

### Requirement: Resizable split has sensible defaults and limits
When both the statement and editor panels are shown in the horizontal layout, the split SHALL default to roughly 45% statement / 55% editor, and the user SHALL NOT be able to resize either panel below a minimum size (statement ≥ 25%, editor ≥ 30%). When the editor panel is not shown (the contest has ended, the problem is already solved, or the viewer is not a participant), the statement panel SHALL take the full width.

#### Scenario: Default split
- **WHEN** a participant opens an unsolved problem in an active contest on a large screen
- **THEN** the statement panel SHALL take about 45% of the width and the editor about 55%

#### Scenario: Resize clamped
- **WHEN** the user drags the resize handle all the way toward one side
- **THEN** the shrinking panel SHALL stop at its minimum size and not collapse

#### Scenario: Editor hidden
- **WHEN** the current problem is already solved by the participant
- **THEN** the statement panel SHALL take the full workspace width

### Requirement: Narrow screens stack statement above editor
Below 1024px viewport width, the contest problem workspace SHALL stack the statement panel above the code editor panel vertically instead of splitting them horizontally, and the editor SHALL keep a usable height (about 70% of the viewport). Only one code editor instance SHALL exist at a time, so the code typed so far is never split across duplicate editors.

#### Scenario: Tablet / phone width
- **WHEN** a participant opens the Problems tab on a 768px-wide viewport
- **THEN** the statement SHALL appear above the editor, each at full width, and the editor SHALL be tall enough to edit comfortably

#### Scenario: Resize across breakpoint keeps code
- **WHEN** the user types code and then resizes the window across the 1024px breakpoint
- **THEN** the layout SHALL switch orientation and the code typed so far SHALL still be in the editor
