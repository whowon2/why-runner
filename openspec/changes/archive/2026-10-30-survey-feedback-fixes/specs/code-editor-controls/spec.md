## ADDED Requirements

### Requirement: Persisted auto-close toggle
The editor SHALL offer a toggle, next to the font-size controls, that turns automatic closing of brackets and quotes (and overtyping/surrounding with them) on or off. It SHALL default to on, be stored in `localStorage` under a single key shared by all editors, and apply to every editor on later visits. If storage is unavailable or holds an invalid value, the default SHALL be used and the toggle SHALL still work for the current page. The toggle SHALL expose its state to assistive technology.

#### Scenario: Turn auto-close off
- **WHEN** a student turns the toggle off and types `(` in the editor
- **THEN** no `)` is inserted

#### Scenario: Setting carries across editors
- **WHEN** a student turns auto-close off on a lesson exercise and later opens a contest problem
- **THEN** the contest editor has auto-close off

#### Scenario: Default
- **WHEN** a student who never used the toggle opens an editor
- **THEN** brackets and quotes close automatically
