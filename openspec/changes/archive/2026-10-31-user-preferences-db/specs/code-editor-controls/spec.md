## MODIFIED Requirements

### Requirement: Fullscreen toggle
The editor SHALL offer a maximize toggle. Inside the editor workspace shell it SHALL collapse the statement column and the bottom panels so the editor (with its language selector, reset, and the Actions' Run and Submit still reachable) fills the whole area below the top bar. Outside the shell it SHALL expand the editor to fill the viewport above all other page content, with page scrolling behind it blocked. Pressing Esc (when no popup is open) or the toggle again SHALL restore the normal layout without losing the code, cursor position or undo history. When vim keybindings are on, Esc pressed while focus is inside the editor SHALL be left to vim and SHALL NOT leave fullscreen; Esc elsewhere and the toggle still leave it.

#### Scenario: Enter and leave fullscreen
- **WHEN** a student types code, clicks the maximize toggle, edits further and presses Esc
- **THEN** the editor returns to its normal layout with all the edits and Ctrl+Z still undoes the last edit

#### Scenario: Submit from fullscreen
- **WHEN** the student clicks submit while the editor is maximized
- **THEN** the submission is sent the same as from the normal layout and its verdict is shown

#### Scenario: Esc closes popup first
- **WHEN** the language selector is open while the editor is maximized and the student presses Esc
- **THEN** only the selector closes and the editor stays maximized

#### Scenario: Esc in vim insert mode
- **WHEN** vim is on, the editor is maximized and the student presses Esc while typing in insert mode
- **THEN** the editor switches to normal mode and stays maximized

### Requirement: Persisted font size
The editor SHALL offer controls to decrease and increase the font size within 10–32 px (default 14 px) and to see the current size. The chosen size SHALL be shared by all editors and applied to every editor on later visits. For signed-in users it SHALL be saved to their account (see `user-preferences`); for signed-out visitors it SHALL be stored in `localStorage` only. If storage is unavailable or holds an invalid value, the default SHALL be used without errors.

#### Scenario: Size carries across editors and reloads
- **WHEN** a student raises the font size to 18 on a lesson exercise and later opens a contest problem in a new tab
- **THEN** the contest editor opens at 18 px

#### Scenario: Size carries across devices
- **WHEN** a signed-in student raises the font size to 18 and later signs in on another computer
- **THEN** editors there open at 18 px

#### Scenario: Bounds
- **WHEN** the font size is 32 px
- **THEN** the increase control is disabled

#### Scenario: Storage blocked
- **WHEN** `localStorage` throws (e.g. blocked site data)
- **THEN** the editor renders at 14 px and the controls still change the size for the current page

### Requirement: Persisted auto-close toggle
The editor SHALL offer a toggle, next to the font-size controls, that turns automatic closing of brackets and quotes (and overtyping/surrounding with them) on or off. It SHALL default to on, be shared by all editors, and apply to every editor on later visits. For signed-in users it SHALL be saved to their account (see `user-preferences`); for signed-out visitors it SHALL be stored in `localStorage` only. If storage is unavailable or holds an invalid value, the default SHALL be used and the toggle SHALL still work for the current page. The toggle SHALL expose its state to assistive technology.

#### Scenario: Turn auto-close off
- **WHEN** a student turns the toggle off and types `(` in the editor
- **THEN** no `)` is inserted

#### Scenario: Setting carries across editors
- **WHEN** a student turns auto-close off on a lesson exercise and later opens a contest problem
- **THEN** the contest editor has auto-close off

#### Scenario: Default
- **WHEN** a student who never used the toggle opens an editor
- **THEN** brackets and quotes close automatically
