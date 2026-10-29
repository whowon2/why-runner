# code-editor-controls Specification

## Purpose
Defines the shared Monaco code editor used by every solution editor (lesson exercise, problem workspace, contest problem): its fullscreen toggle and its font-size control persisted in localStorage.
## Requirements
### Requirement: Every code editor uses the shared editor component
Every Monaco code editor where users write a solution (lesson exercise, standalone problem workspace, contest problem) SHALL be rendered through one shared editor component, which owns the theme mapping, the editor toolbar and the translation opt-out.

#### Scenario: Same controls everywhere
- **WHEN** a user opens the code editor on a lesson exercise, a problem's submit tab and a contest problem
- **THEN** all three show the same fullscreen and font-size controls

### Requirement: Fullscreen toggle
The editor SHALL offer a fullscreen toggle that expands the editor (with its language selector, reset and submit actions still reachable) to fill the viewport above all other page content. Pressing Esc or the toggle again SHALL restore the normal layout without losing the code, cursor position or undo history. Page scrolling behind the fullscreen editor SHALL be blocked.

#### Scenario: Enter and leave fullscreen
- **WHEN** a student types code, clicks the fullscreen toggle, edits further and presses Esc
- **THEN** the editor returns to its place in the page with all the edits and Ctrl+Z still undoes the last edit

#### Scenario: Submit from fullscreen
- **WHEN** the student clicks submit while in fullscreen
- **THEN** the submission is sent the same as from the normal layout

### Requirement: Persisted font size
The editor SHALL offer controls to decrease and increase the font size within 10–32 px (default 14 px) and to see the current size. The chosen size SHALL be stored in `localStorage` under a single key shared by all editors and SHALL be applied to every editor on later visits. If storage is unavailable or holds an invalid value, the default SHALL be used without errors.

#### Scenario: Size carries across editors and reloads
- **WHEN** a student raises the font size to 18 on a lesson exercise and later opens a contest problem in a new tab
- **THEN** the contest editor opens at 18 px

#### Scenario: Bounds
- **WHEN** the font size is 32 px
- **THEN** the increase control is disabled

#### Scenario: Storage blocked
- **WHEN** `localStorage` throws (e.g. blocked site data)
- **THEN** the editor renders at 14 px and the controls still change the size for the current page

