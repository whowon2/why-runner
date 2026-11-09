# submitted-code-highlighting Specification

## Purpose
Read-only code views (submission history, lesson review, generated Portugol) highlight code with the code editor's own Monaco grammar and app theme, with a plain-text fallback; Portugol has a grammar in the editor and these views.
## Requirements
### Requirement: Read-only submitted code is syntax-highlighted
Read-only code views SHALL highlight code with the same grammar and app theme as the code editor, without mounting an editor instance per view. This covers at least: the workspace submission history, the teacher's lesson review (each student's submitted answer) and the generated Portugol panel of block exercises. The language used SHALL be the submission's language (Portugol for the generated panel); a language with no grammar SHALL render as plain text.

#### Scenario: Submission history
- **WHEN** a student opens the submission history of a problem they submitted in Python
- **THEN** the submitted code shows keywords, strings and comments in the same colors as the editor

#### Scenario: Teacher reviews a lesson
- **WHEN** a teacher opens the lesson review of a student who answered an exercise in C
- **THEN** the student's code is highlighted with the C grammar

#### Scenario: Theme change
- **WHEN** the user switches between light and dark mode or previews another theme with submitted code on screen
- **THEN** the highlighted code recolors to match the editor

### Requirement: Plain-text fallback
Read-only code views SHALL show the code as plain monospaced text until the highlighter is ready, and keep showing it if the highlighter fails to load. The text content SHALL be identical in both states, and the views SHALL keep `translate="no"` and the `notranslate` class in both states.

#### Scenario: Highlighter not loaded yet
- **WHEN** the lesson review renders before Monaco has loaded
- **THEN** every answer's code is already readable as plain text, and becomes highlighted once Monaco loads

#### Scenario: Translated page
- **WHEN** a page with highlighted submitted code is translated by the browser
- **THEN** the code text is not translated

### Requirement: Portugol grammar
The code editor and read-only code views SHALL highlight Portugol: keywords (e.g. `programa`, `funcao`, `se`, `senao`, `enquanto`, `para`, `retorne`), types (`inteiro`, `real`, `cadeia`, `caracter`, `logico`, `vazio`), constants (`verdadeiro`, `falso`), numbers, strings, and `//` / `/* */` comments.

#### Scenario: Editor in Portugol
- **WHEN** a student selects Portugol in the editor
- **THEN** keywords, types, strings and comments are colored

#### Scenario: Generated Portugol panel
- **WHEN** a student builds a program with blocks
- **THEN** the generated Portugol panel shows the code highlighted with the Portugol grammar

