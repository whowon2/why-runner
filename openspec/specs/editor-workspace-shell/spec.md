# editor-workspace-shell Specification

## Purpose
Defines the fullscreen editor workspace shared by the standalone problem, contest problem and lesson exercise pages: top bar, icon rail with drawers, statement with console, editor, test cases with example Play, actions with an inline verdict, and the narrow-screen fallback.

## Requirements
### Requirement: Editor pages use one fullscreen workspace shell
The standalone problem page, the contest problem page and the lesson exercise page SHALL render inside one shared workspace shell that fills the viewport (`100dvh`, no page scroll) and does not show the site dock or footer. The shell SHALL consist of: a top bar, a left icon rail, a statement column, an editor area, a Test cases panel and an Actions panel below the editor, and a Console panel at the bottom of the statement column. Only the slot contents SHALL differ between the three contexts.

#### Scenario: No site chrome
- **WHEN** a student opens a problem, a contest problem or a lesson exercise on a 1920×1080 viewport
- **THEN** the page fills the viewport, the site dock and footer are not rendered, and the document does not scroll

#### Scenario: Other pages keep site chrome
- **WHEN** the user opens the problem list, the contest page, or a lesson roadmap
- **THEN** the dock and footer are shown as before

### Requirement: Top bar shows title and status
The top bar SHALL show the problem (or exercise) title on the left, prefixed by its contest letter in contests, and on the right a status summary for the context: the student's best result on this problem (solved / not yet / attempted) for practice and lessons, and the remaining contest time plus solved count in contests. Difficulty, time limit and memory limit SHALL be visible in the top bar or at the top of the statement.

#### Scenario: Practice status
- **WHEN** a student who has a PASSED submission opens the problem
- **THEN** the top bar's right side shows that the problem is solved

#### Scenario: Contest timer
- **WHEN** a participant opens a problem in a running contest
- **THEN** the top bar shows the time left until the contest ends, updating every second, and the number of problems they solved

### Requirement: Left rail provides navigation and drawers
The rail SHALL be a narrow vertical bar of icon buttons with short labels. It SHALL always include Back (to the page the workspace belongs to: problem list, contest page, or lesson roadmap), Submissions (opens the history drawer) and Settings (editor font size and theme). Context items SHALL be added: Statistics and Tests for practice problems; the contest's problem letters (with solved marking) and Leaderboard for contests; previous/next exercise for lessons. Drawers SHALL open over the workspace without unmounting the editor, so code is never lost.

#### Scenario: Back from a contest problem
- **WHEN** a participant clicks Back on a contest problem
- **THEN** they return to the contest page

#### Scenario: Switch contest problem from the rail
- **WHEN** a participant clicks letter C in the rail
- **THEN** the workspace shows problem C, with the editor holding problem C's saved draft for the selected language

#### Scenario: Drawer keeps code
- **WHEN** a student types code, opens the Submissions drawer and closes it
- **THEN** the editor still contains the typed code with its undo history

### Requirement: Statement column
The statement column SHALL scroll independently and show, in order: the narrative (when set, styled as flavor text), the description (Markdown + math), the visible examples, and, for lesson exercises, the answer-mode hint and the read-only solution constraints. The split between statement column and the editor side SHALL be resizable on wide screens (default about 40% / 60%, statement ≥ 25%, editor side ≥ 35%).

#### Scenario: Long statement
- **WHEN** the statement is taller than the viewport
- **THEN** only the statement column scrolls; the editor and panels stay in place

### Requirement: Console panel shows the latest output
The Console panel SHALL sit at the bottom of the statement column, collapsible, hold the custom-run stdin box, and SHALL show the output of the most recent action in this workspace: for a custom run, the run result; for an example play, the example's input, expected output, the program's stdout/stderr, run status and match result; for a submission, the submission's report as redacted for the viewer (same content as the existing submission details). The panel SHALL expand automatically when a new result arrives and SHALL remember its collapsed state per viewer.

#### Scenario: Run result appears in console
- **WHEN** a student plays example 1 and the program prints the wrong output
- **THEN** the console expands and shows example 1's input, expected output, the program's output and a mismatch marker

### Requirement: Editor area
The editor area SHALL render the shared code editor with a language selector, open-file, reset-to-starter and maximize controls at its top. For lesson exercises in `blocks` mode it SHALL render the block workspace (with its view-code toggle) instead, and in `parsons` mode the Parsons editor. When the viewer may not submit (contest ended, problem already solved in a contest, viewer not a participant, exercise submissions locked) the editor area SHALL show a message explaining why and the Actions panel SHALL be disabled; the statement and history remain available.

#### Scenario: Blocks exercise
- **WHEN** a student opens an exercise in blocks mode
- **THEN** the editor area shows the block workspace and Submit sends the serialized workspace

#### Scenario: Solved contest problem
- **WHEN** a participant opens a contest problem they already solved
- **THEN** the editor area says the problem is solved and Submit and Run are disabled

### Requirement: Test cases panel
The Test cases panel SHALL list each test the viewer may see (per `test-case-visibility` and the lesson's visibility mode) labelled with its original test number, each row with a Play button (per `custom-run` "Play visible examples", only when runs are available) and an indicator of that test's latest play in this workspace (not run / running / match / mismatch / run status). Clicking a row SHALL show its details in the Console. When hidden tests exist the panel SHALL say how many are hidden. When the viewer may see no tests the panel SHALL say so.

#### Scenario: Play one test
- **WHEN** a student clicks Play on Example 2
- **THEN** a run with Example 2's input starts, the row shows a running indicator, and when it finishes the row shows match, mismatch or the run status

### Requirement: Actions panel and inline verdict
The Actions panel SHALL offer "Run" (custom input from the Console), "Run all test cases" (when runs are available) and "Submit". After Submit the panel SHALL show the new submission's status live (pending/running, then the final verdict badge and passed/total tests) without navigation, the Console SHALL show its report, and the Submissions history SHALL include it. When the final status is a failure (or a pass) and AI help is allowed for the context, an AI help button SHALL be offered next to the verdict. Submit and Run SHALL be disabled while a request is being sent.

#### Scenario: Verdict without switching views
- **WHEN** a student clicks Submit on a standalone problem
- **THEN** within the same screen the Actions panel shows "Pending", then the final verdict and passed count once the judge finishes, with no tab change or page navigation

#### Scenario: AI help in contest respects setting
- **WHEN** a contest has `aiAssistance = off` and a participant's submission fails
- **THEN** no AI help button is shown

### Requirement: Submissions history drawer
The Submissions rail item SHALL open a drawer listing the viewer's own submissions for this problem in this context (practice, this contest, or this exercise), most recent first, each with time, language, status, code size, and expandable code and report (redacted for the viewer), plus a button to load that submission's code into the editor.

#### Scenario: Load older code
- **WHEN** a student opens the drawer and clicks "Load into editor" on an earlier submission
- **THEN** the editor's language and code change to that submission's, and reset can still restore the starter

### Requirement: Drafts persist per problem and language
In all three contexts the code editor SHALL keep drafts as the `editor-drafts` capability defines (per user, target and language, last language restored), with the contest target being the contest plus the problem.

#### Scenario: Reload keeps code
- **WHEN** a student types Python code on a contest problem and reloads the page
- **THEN** the editor selects Python again and shows the code they typed

### Requirement: Maximize editor
The editor's maximize control SHALL collapse the statement column and the bottom panels so the editor takes the whole area below the top bar; clicking it again or pressing Esc (when no popup is open) SHALL restore the layout. The editor SHALL stay mounted, keeping code, cursor and undo history.

#### Scenario: Maximize and restore
- **WHEN** a student maximizes the editor, types, and presses Esc
- **THEN** the full workspace is shown again with the typed code and Ctrl+Z still undoes the last edit

### Requirement: Narrow-screen fallback
Below 1024px viewport width the shell SHALL show one column at a time with a bottom switcher between Statement, Code and Results (Results = Test cases + Actions + Console). The rail SHALL collapse into a menu button in the top bar. Exactly one editor instance SHALL exist; switching views SHALL hide it, not unmount it. Submitting or running from the Code view SHALL switch to Results.

#### Scenario: Phone submit
- **WHEN** a student on a 390px-wide screen types code and taps Submit
- **THEN** the view switches to Results and shows the submission's live status

#### Scenario: Resize keeps code
- **WHEN** a student types code and resizes the window across 1024px
- **THEN** the layout changes and the code is still in the editor

### Requirement: Lesson exercise workspace
The lesson exercise page SHALL use the shell with: Back to the lesson roadmap, previous/next exercise in the rail, a "completed" status in the top bar when the exercise is done, Submit/Run sending the answer in the exercise's mode (code, blocks or parsons), and history from the exercise's own submissions.

#### Scenario: Next exercise
- **WHEN** a student clicks Next in the rail
- **THEN** the next exercise of the lesson opens in the same shell

