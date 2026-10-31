## ADDED Requirements

### Requirement: Editor section on the settings page
`/settings` SHALL have an "Editor" section next to Appearance and Notifications. It SHALL offer: font size (10–32 px, default 14), auto-close brackets and quotes (default on), vim keybindings (default off), tab size (2, 4 or 8, default 4), word wrap (default off), line numbers (on, off or relative, default on) and minimap (default on). Defaults SHALL match how the editor behaves before this change. The workspace Settings drawer SHALL offer the same editor options. Changes SHALL apply immediately without a save button and persist as described in `user-preferences`. All labels SHALL be translated in every locale.

#### Scenario: Open the editor section
- **WHEN** a signed-in user opens `/settings` and selects "Editor"
- **THEN** the section shows every editor option with its current value

#### Scenario: Same options in the workspace
- **WHEN** a student opens the Settings drawer in a problem, contest problem or lesson exercise workspace
- **THEN** it shows the same editor options as the Editor section, with the same current values, and changes apply to the open editor immediately

#### Scenario: Translated labels
- **WHEN** the site language is Portuguese
- **THEN** every label in the Editor section is in Portuguese

### Requirement: Editor options apply to every editor
Every solution editor (lesson exercise, standalone problem, contest problem, including fullscreen) SHALL apply the current editor options, and a change SHALL reach editors already open in other tabs without a reload.

#### Scenario: Word wrap reaches open editor
- **WHEN** a student has a problem open in one tab and turns word wrap on in `/settings` in another tab
- **THEN** long lines wrap in the problem editor without reloading it

#### Scenario: Tab size honored
- **WHEN** tab size is 2 and the student presses Tab at the start of an empty line
- **THEN** the editor indents by 2 columns regardless of the starter code's indentation

#### Scenario: Relative line numbers
- **WHEN** line numbers are set to relative
- **THEN** the gutter shows distances from the cursor line

### Requirement: Vim keybindings
When vim keybindings are on, every solution editor SHALL use vim-style modal editing and show a status line under the editor with the current mode and any pending command. The vim support code SHALL load only when the option is on. Turning the option off SHALL return the editor to normal editing without losing code, cursor position or undo history.

#### Scenario: Normal mode editing
- **WHEN** vim is on, the editor is in normal mode and the student types `dd`
- **THEN** the current line is deleted

#### Scenario: Status line
- **WHEN** vim is on and the student presses `i`
- **THEN** the status line under the editor shows insert mode

#### Scenario: Toggle off keeps code
- **WHEN** a student with code in the editor turns vim off in another tab
- **THEN** the editor switches to normal editing, the code is unchanged, and Ctrl+Z still undoes the last edit

#### Scenario: Not loaded when off
- **WHEN** vim is off and a student opens a problem
- **THEN** the vim support code is not downloaded
