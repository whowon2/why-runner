## ADDED Requirements

### Requirement: AI help dialog stays readable at any length
The AI help dialog, in contests and in lesson exercises, SHALL fit within the viewport. When the revealed hints are longer than the available height, the hint area SHALL scroll while the dialog title and its action buttons stay visible. A newly revealed hint SHALL be scrolled into view.

#### Scenario: Long explanation
- **WHEN** a student opens AI help and the response is longer than the screen
- **THEN** they can scroll the response to its end and still reach the close and next-level buttons

#### Scenario: Next level revealed
- **WHEN** a contest participant requests the next hint level after reading a long first hint
- **THEN** the dialog scrolls to show the new hint

### Requirement: AI help can be docked next to the editor
On the lesson exercise page and the contest problem tab, on screens at least 1024 px wide, the AI help dialog SHALL offer to dock its content as a side panel next to the code editor. The docked panel SHALL show the same hints for that submission as the dialog (without new AI requests), SHALL allow requesting the next level where the dialog would, SHALL scroll independently, and SHALL be closable. Docking another submission's help SHALL replace the panel's content. On narrower screens the dock option SHALL NOT be offered.

#### Scenario: Dock a hint
- **WHEN** a student on a wide screen opens AI help on a failed exercise submission and chooses to dock it
- **THEN** the dialog closes and the hint appears in a panel beside the editor, and the student can keep typing in the editor

#### Scenario: Same hints in dialog and panel
- **WHEN** a contest participant revealed `concept` in the dialog and then docks it
- **THEN** the panel shows the `concept` hint and offers the `hint` level, with no new AI request for `concept`

#### Scenario: Narrow screen
- **WHEN** the screen is narrower than 1024 px
- **THEN** the AI help dialog shows no dock option
