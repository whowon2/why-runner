## ADDED Requirements

### Requirement: Participant sees the code of each own contest attempt
In a contest problem's submission list, expanding an attempt SHALL show the exact source code that was submitted for that attempt, read-only, with whitespace and indentation preserved. The code SHALL be shown for every status, including `PENDING` and `RUNNING` attempts that have no judge output yet. The code SHALL appear alongside, not instead of, the existing judge report and AI help controls.

#### Scenario: Expanding a failed attempt
- **WHEN** a participant expands an attempt with status `FAILED` in the contest problem submission list
- **THEN** they SHALL see that attempt's submitted code and, below or beside it, the judge report as before

#### Scenario: Attempt still being judged
- **WHEN** a participant expands an attempt with status `PENDING` or `RUNNING`
- **THEN** they SHALL see that attempt's submitted code even though no judge output exists yet

#### Scenario: Different attempts show different code
- **WHEN** a participant submitted two different versions of a solution to the same problem
- **THEN** expanding each attempt SHALL show the code of that attempt, not the current editor contents or the latest attempt

### Requirement: Attempt language is visible
Each attempt in the contest problem submission list SHALL display the language it was submitted in, visible without expanding the attempt.

#### Scenario: Collapsed attempt row
- **WHEN** a participant views the submission list without expanding any attempt
- **THEN** each row SHALL show its time, language, and status

### Requirement: Participant can copy an attempt's code
The code view of an attempt SHALL offer a copy-to-clipboard action that copies the attempt's full source code, with a confirmation shown on success.

#### Scenario: Copying an earlier attempt
- **WHEN** a participant clicks the copy action on an attempt's code
- **THEN** that attempt's full source code SHALL be placed on the clipboard and a "copied" confirmation SHALL be shown

### Requirement: Only the participant's own attempts are exposed
The contest problem submission list SHALL only ever return and show the current user's own attempts and code. Code of other participants SHALL NOT be returned by the action backing this list, regardless of the arguments it is called with.

#### Scenario: Calling the action with another user's id
- **WHEN** a client calls the contest submission-list action directly with another participant's user id
- **THEN** the action SHALL still return only the calling user's own submissions

### Requirement: Contest editor code is auto-saved locally on blur
When the contest code editor loses focus, the current code SHALL be written to the browser's localStorage under the same per-problem, per-language key used by the manual save button and the "load saved code" prompt. Nothing SHALL be written when no language is selected, the editor is empty, or the code is unchanged since the last save. After a save, the UI SHALL show that the code was saved: the save button SHALL briefly change to a "saved" state, and a line SHALL show the time the code was saved in this browser. The indicator SHALL reset when the problem or language changes.

#### Scenario: Leaving the editor saves the code
- **WHEN** a participant with a language selected edits code and then clicks outside the editor
- **THEN** the code SHALL be stored in localStorage for that problem and language, the save button SHALL briefly show a check, and "Saved in this browser at HH:MM" SHALL appear

#### Scenario: No language selected
- **WHEN** the editor loses focus and no language is selected
- **THEN** nothing SHALL be saved and no saved indicator SHALL appear

#### Scenario: Unchanged code
- **WHEN** the editor loses focus and the code equals what is already stored
- **THEN** no new save SHALL happen and the save button SHALL NOT flash again

### Requirement: Each problem and language keeps its own saved code
The contest editor SHALL keep a separate locally saved version of the code for every problem and language pair. Switching to another problem or language SHALL first save the editor's code into the slot being left, then show the saved code of the slot being entered, or an empty editor when there is none. Code SHALL never be saved into a slot other than the one it was written for. Empty code SHALL NOT overwrite a saved version. Closing or reloading the page SHALL save the current slot.

#### Scenario: Switching languages keeps both versions
- **WHEN** a participant writes a Python solution, switches to C++, writes a C++ solution, and switches back to Python
- **THEN** the editor SHALL show the Python solution, and switching to C++ again SHALL show the C++ solution

#### Scenario: Switching problems keeps each problem's code
- **WHEN** a participant writes code for problem A in C, then opens problem B with C still selected
- **THEN** the editor SHALL show problem B's saved C code (or be empty), and problem A's C code SHALL remain saved under problem A

#### Scenario: Code typed before choosing a language
- **WHEN** a participant types code with no language selected, then selects a language that already has saved code
- **THEN** the typed code SHALL stay in the editor and the participant SHALL be offered to load the saved version instead
