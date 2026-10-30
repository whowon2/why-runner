# editor-starter-code Specification

## Purpose
Defines the per-language starter templates shown in code editors (problem workspace, contest upload panel, class exercise), when they load on language selection, how they interact with contest localStorage slots, and the reset-to-starter action with undo.
## Requirements
### Requirement: Every supported language has a starter template
The system SHALL define one starter template for each value of the `language` enum (`c`, `cpp`, `java`, `python`, `rust`, `portugol`). Each template SHALL be a complete program that, submitted unchanged, compiles and runs in the judge, reads two whitespace-separated integers from standard input, and writes their sum followed by a newline to standard output. Each template SHALL contain a comment marking the input-reading line(s) and a comment marking the output-writing line(s), with the comment text in the user's current UI locale. The Java template SHALL declare `public class Main`.

#### Scenario: Template exists for every language
- **WHEN** the set of starter templates is compared with the `language` enum values
- **THEN** every enum value SHALL have exactly one template

#### Scenario: Template runs in the judge
- **WHEN** any language's starter template is submitted unchanged to a problem whose input is `2 3`
- **THEN** the program SHALL compile and output `5`

#### Scenario: Comments follow locale
- **WHEN** a user with the pt-BR UI locale loads a starter template
- **THEN** the input/output comments SHALL be in Portuguese, and the code itself SHALL be identical to the English-locale template

### Requirement: Selecting a language loads its starter code without discarding user code
In the problem workspace Submit tab and the class exercise code mode, when the user selects a language the system SHALL replace the editor content if and only if the current content is empty (whitespace only) or exactly equals the starter template of the previously selected language. The replacement SHALL be the user's saved draft for the selected language (per the editor-drafts capability) when one exists, and that language's starter template otherwise. Otherwise the editor content SHALL be left unchanged. (The contest upload panel instead swaps per-language saved slots, see below.)

#### Scenario: First language selection on empty editor
- **WHEN** the editor is empty, there is no saved draft for `python`, and the user selects `python`
- **THEN** the editor SHALL show the Python starter template

#### Scenario: Switching language with untouched starter
- **WHEN** the editor holds the unmodified C starter, there is no saved draft for `java`, and the user switches to `java`
- **THEN** the editor SHALL show the Java starter template

#### Scenario: Switching to a language with a saved draft
- **WHEN** the editor holds the unmodified C starter and the user has a saved `java` draft for this target, and the user switches to `java`
- **THEN** the editor SHALL show the saved `java` draft

#### Scenario: Switching language with edited code
- **WHEN** the user has modified the editor content and switches language
- **THEN** the editor content SHALL remain exactly as the user left it

### Requirement: Contest editor shows starter only when no code is saved
In the contest problem upload panel, when entering a problem+language slot, the system SHALL show the saved code if the slot has any, and SHALL show the language's starter template otherwise. Slots SHALL be the current user's drafts for the contest and problem (per the editor-drafts capability). Code saved before this change under the user-less `code-<problemId>-<language>` key SHALL be read when the user's slot is empty and then moved to the user's slot. The system SHALL NOT write code to a slot when that code equals the language's starter template. The last language used for the contest problem SHALL be selected again when the panel mounts.

#### Scenario: Slot with saved code
- **WHEN** a user selects a language for which the current problem has saved code in localStorage
- **THEN** the editor SHALL show the saved code, not the starter

#### Scenario: Empty slot
- **WHEN** a user selects a language for which the current problem has no saved code
- **THEN** the editor SHALL show the starter template

#### Scenario: Untouched starter not persisted
- **WHEN** the editor holds the unmodified starter and the editor blurs or the page is hidden
- **THEN** the slot in localStorage SHALL remain unchanged

#### Scenario: Legacy slot migrated
- **WHEN** a user has code under `code-<problemId>-python` from before this change and selects `python` on that problem
- **THEN** the editor SHALL show that code and it SHALL be stored under the user's draft key

#### Scenario: Language restored after locale switch
- **WHEN** a user writing `cpp` code on a contest problem switches the site language
- **THEN** the panel SHALL select `cpp` again and show the saved code

### Requirement: Reset button restores the starter code with undo
Every code editor toolbar SHALL include a "Reset to starter code" icon button with a tooltip. The button SHALL be disabled while no language is selected. Activating it SHALL replace the editor content with the current language's starter template, SHALL remove the saved draft for the current target and language, and SHALL show a toast with an "Undo" action that restores the content present before the reset. When the content already equals the starter, the reset SHALL do nothing and show no toast.

#### Scenario: Reset edited code
- **WHEN** a user with edited code in `rust` clicks the reset button
- **THEN** the editor SHALL show the Rust starter template and a toast with an "Undo" action SHALL appear

#### Scenario: Undo a reset
- **WHEN** the user clicks "Undo" on the reset toast
- **THEN** the editor SHALL show the code exactly as it was before the reset

#### Scenario: Reset in contest clears the saved slot
- **WHEN** a user resets the code in any editor (contest panel, problem Submit tab or exercise) and then reloads the page and reselects the same language
- **THEN** the editor SHALL show the starter template, not the code saved before the reset

#### Scenario: Reset disabled without language
- **WHEN** no language is selected
- **THEN** the reset button SHALL be disabled

