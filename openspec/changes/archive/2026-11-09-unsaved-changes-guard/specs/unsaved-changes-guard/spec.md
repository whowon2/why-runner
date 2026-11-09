## ADDED Requirements

### Requirement: One save rule across screens

Every editable screen SHALL follow one of three save modes, chosen by what it
edits:

- **Save on change**: a single control whose value is complete as soon as it
  is picked (switch, select, checkbox, preset, a lone date) SHALL save when it
  changes and confirm it (toast or inline "saved"). These screens have no Save
  button and no leave guard.
- **Explicit save**: a form with several fields or free text (problem editor,
  contest settings, profile, exercise constraints, survey answers) SHALL save
  only through its Save/Submit button. The button SHALL be disabled while the
  form has nothing unsaved (except the survey Submit, which validates on
  click), and the form SHALL be registered with the leave guard.
- **Dialog**: a create/rename dialog SHALL commit with its confirm button and
  discard with Cancel or Escape; closing a dialog is an explicit choice and is
  not guarded.

Code editor drafts keep their existing local draft storage and are not part of
the leave guard.

#### Scenario: Single control saves on change

- **WHEN** a teacher changes a lesson exercise's mode in its select
- **THEN** the change is saved and confirmed without a Save button

#### Scenario: Explicit-save form starts with Save disabled

- **WHEN** the author opens an existing problem's edit page and changes nothing
- **THEN** the Save button is disabled and leaving the page shows no prompt

### Requirement: Dirty state reflects unsaved edits only

A guarded form SHALL count as dirty only while its current values differ from
the last saved values. Opening a form, or a save that succeeded, SHALL leave it
clean; editing a field back to its saved value SHALL make it clean again.

#### Scenario: New problem is clean on load

- **WHEN** an author creates a new problem and lands on its edit page
- **THEN** the form shows one blank test case and is not dirty

#### Scenario: Save makes the form clean

- **WHEN** the author edits the problem title and clicks Save, and the save succeeds
- **THEN** the form is clean, the Save button is disabled and leaving shows no prompt

#### Scenario: Failed save keeps the form dirty

- **WHEN** a save fails
- **THEN** the form keeps the edits and stays dirty

#### Scenario: Survey preview is never dirty

- **WHEN** an admin fills in a survey preview (no entity to save to)
- **THEN** the leave guard is not engaged

### Requirement: Browser unload prompt

While any registered form is dirty, closing the tab, reloading, or leaving the
site by URL SHALL trigger the browser's native leave-site confirmation
(`beforeunload`). When no form is dirty the page SHALL NOT register a
`beforeunload` handler.

#### Scenario: Reload with unsaved edits

- **WHEN** the author edits a test case's output and reloads the page
- **THEN** the browser asks to confirm leaving

#### Scenario: Reload with nothing unsaved

- **WHEN** no registered form is dirty and the user reloads
- **THEN** the page reloads with no prompt

### Requirement: In-app navigation confirmation

While any registered form is dirty, every in-app navigation SHALL open a
localized confirmation dialog ("Discard unsaved changes?") before leaving,
with "Stay" (default, cancels the navigation) and "Leave without saving"
(continues it). This SHALL cover link clicks (internal `<a>` / `Link`),
programmatic navigation through the app router (`push`, `replace`, `back`,
`forward`, including tab switches that change the URL, the command palette and
the language switcher) and the browser Back/Forward buttons. Links that open
in a new tab or window (modifier keys, middle click, `target="_blank"`,
downloads) and links to the current URL or an in-page `#hash` SHALL NOT be
intercepted. A navigation started by the form itself after a successful save
SHALL NOT be intercepted.

#### Scenario: Clicking a link with unsaved edits

- **WHEN** the author has unsaved edits and clicks "Try it"
- **THEN** a dialog asks to discard the changes, and the page stays put until they choose

#### Scenario: Choosing Stay

- **WHEN** the dialog is open and the user clicks Stay or presses Escape
- **THEN** the navigation is canceled and the edits are kept

#### Scenario: Choosing Leave without saving

- **WHEN** the user clicks "Leave without saving"
- **THEN** the original navigation happens and the edits are discarded

#### Scenario: Browser Back with unsaved edits

- **WHEN** the author has unsaved edits and presses the browser Back button
- **THEN** the URL stays on the editor and the dialog opens; Leave goes back one entry

#### Scenario: Switching contest tab with unsaved settings

- **WHEN** an organizer edits the contest name and switches from Settings to Problems
- **THEN** the dialog opens before the tab changes

#### Scenario: Ctrl-click opens a new tab without prompting

- **WHEN** the user ctrl-clicks a link while the form is dirty
- **THEN** the link opens in a new tab and the current page is untouched

#### Scenario: Rename redirect after save

- **WHEN** the author renames a problem, saves, and the editor redirects to the new slug
- **THEN** no dialog opens

### Requirement: Publishing warns about unsaved problem edits

Publishing a problem publishes its last saved version. While the problem
editor is dirty, the Publish action SHALL tell the author that unsaved edits
will not be published and ask them to save first, and SHALL NOT publish.

#### Scenario: Publish with unsaved edits

- **WHEN** the author edits the description and clicks Publish without saving
- **THEN** publishing is blocked with a "save your changes first" message
