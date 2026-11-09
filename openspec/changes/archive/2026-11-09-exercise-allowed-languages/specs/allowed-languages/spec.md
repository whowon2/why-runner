## ADDED Requirements

### Requirement: Allowed languages per lesson exercise
Each lesson exercise SHALL have an allowed-languages list (`exercise.allowed_languages`, a subset of the `language` enum). An empty list SHALL mean every language is allowed, which is the default for new and existing exercises. Only a user who can manage the exercise's lesson (owner or co-teacher) SHALL be able to change it, from a "Languages" dialog on the exercise row of the lesson roadmap. The list SHALL only restrict `code` mode exercises: `blocks` (Portugol) and `parsons` (the solution's language) keep the language their mode fixes.

#### Scenario: Teacher restricts an exercise to C
- **WHEN** the lesson's teacher opens Languages on an exercise, checks only `c` and saves
- **THEN** the exercise's allowed list is `[c]` and the roadmap row shows a `c` badge

#### Scenario: Clearing the list
- **WHEN** the teacher unchecks every language and saves
- **THEN** the list is empty and students may use any language again

#### Scenario: Student cannot change the list
- **WHEN** a class member who does not manage the lesson calls the save action directly
- **THEN** the action is rejected and the list is unchanged

#### Scenario: Visual modes ignore the list
- **WHEN** an exercise restricted to `[c]` is in `blocks` mode and a student submits blocks
- **THEN** the Portugol program is accepted as before

### Requirement: Allowed languages per contest problem
Each contest problem (`problem_on_contest.allowed_languages`) SHALL have the same kind of list, empty meaning every language. Only a user who can manage the contest SHALL change it, from the contest Settings → Problems list, and only while the contest is not locked (not started), returning `CONTEST_STARTED` otherwise.

#### Scenario: Owner restricts a contest problem before the start
- **WHEN** the contest owner sets problem B's languages to `[cpp, python]` before the contest starts
- **THEN** problem B's allowed list is `[cpp, python]`

#### Scenario: Contest already started
- **WHEN** the owner tries to change a problem's languages after the contest started
- **THEN** the action returns `CONTEST_STARTED` and nothing changes

### Requirement: Server-side enforcement on submit and run
`createExerciseSubmission` (code mode), `createSubmission` (contest) and `createRun` (exercise code mode and contest contexts) SHALL return the failure `LANGUAGE_NOT_ALLOWED` (with the allowed languages as a parameter) and create no row when the request's language is not in a non-empty allowed list. The check SHALL use the list stored in the database, never a list sent by the client. Standalone problem submissions and runs SHALL stay unrestricted.

#### Scenario: Submitting a disallowed language
- **WHEN** a student posts a Python submission to an exercise restricted to `[c]`, bypassing the UI
- **THEN** the action returns `LANGUAGE_NOT_ALLOWED`, no submission is written and the judge is not notified

#### Scenario: Running a disallowed language
- **WHEN** a contest participant requests a custom run in Java on a problem restricted to `[cpp]`
- **THEN** the action returns `LANGUAGE_NOT_ALLOWED` and no `code_run` row is created

#### Scenario: Allowed language
- **WHEN** a student submits C to an exercise restricted to `[c, cpp]`
- **THEN** the submission is created as before

### Requirement: Editor offers only allowed languages
In the editor workspace the language selector SHALL list only the context's allowed languages (all six when the list is empty). When exactly one language is allowed and none is selected, it SHALL be preselected. A restored draft language that is not allowed SHALL be replaced by an allowed one, and loading a past submission whose language is not allowed SHALL warn and leave the editor unchanged. The statement SHALL show "Allowed languages: …" when the list is non-empty (instead of the suggested-language line on exercises).

#### Scenario: Restricted selector
- **WHEN** a student opens an exercise restricted to `[c, cpp]`
- **THEN** the language selector offers only `c` and `cpp` and the statement says "Allowed languages: c, cpp"

#### Scenario: Single language preselected
- **WHEN** a student opens a contest problem restricted to `[python]` with no saved draft
- **THEN** the editor starts with `python` selected and its starter code

#### Scenario: Stale draft language
- **WHEN** a student's last saved draft for an exercise is in Java and the teacher later restricts the exercise to `[c]`
- **THEN** the editor opens with `c` selected instead of Java
