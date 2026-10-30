## MODIFIED Requirements

### Requirement: Every code editor uses the shared editor component
Every Monaco code editor where users write a solution (lesson exercise, standalone problem workspace, contest problem) SHALL be rendered through one shared editor component, which owns the theme mapping, the editor toolbar and the translation opt-out.

#### Scenario: Same controls everywhere
- **WHEN** a user opens the code editor on a lesson exercise, a standalone problem and a contest problem
- **THEN** all three show the same maximize and font-size controls

### Requirement: Fullscreen toggle
The editor SHALL offer a maximize toggle. Inside the editor workspace shell it SHALL collapse the statement column and the bottom panels so the editor (with its language selector, reset, and the Actions' Run and Submit still reachable) fills the whole area below the top bar. Outside the shell it SHALL expand the editor to fill the viewport above all other page content, with page scrolling behind it blocked. Pressing Esc (when no popup is open) or the toggle again SHALL restore the normal layout without losing the code, cursor position or undo history.

#### Scenario: Enter and leave fullscreen
- **WHEN** a student types code, clicks the maximize toggle, edits further and presses Esc
- **THEN** the editor returns to its normal layout with all the edits and Ctrl+Z still undoes the last edit

#### Scenario: Submit from fullscreen
- **WHEN** the student clicks submit while the editor is maximized
- **THEN** the submission is sent the same as from the normal layout and its verdict is shown

#### Scenario: Esc closes popup first
- **WHEN** the language selector is open while the editor is maximized and the student presses Esc
- **THEN** only the selector closes and the editor stays maximized
