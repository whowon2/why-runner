## ADDED Requirements

### Requirement: Professor can set an exercise's answer mode to blocks
The system SHALL let the owner of a lesson set each exercise's answer mode to `code` (default), `blocks`, or `parsons`. Setting `blocks` SHALL set the exercise's primary language to Portugol and SHALL NOT allow another language while the mode is `blocks`. The mode SHALL belong to the exercise, so the same problem used in another lesson, a contest, or the standalone problem page keeps its own behavior.

#### Scenario: Professor switches an exercise to blocks
- **WHEN** the lesson owner sets an exercise's answer mode to `blocks`
- **THEN** the exercise's mode is stored as `blocks` and its primary language is Portugol

#### Scenario: Same problem in another lesson is unaffected
- **WHEN** a problem backs a `blocks` exercise in one lesson and an exercise in another lesson with default settings
- **THEN** the other lesson's exercise still uses the `code` mode

#### Scenario: Existing exercises default to code
- **WHEN** a student opens an exercise created before answer modes existed
- **THEN** it shows the code editor exactly as before

#### Scenario: Non-owner cannot change the mode
- **WHEN** a user who does not own the lesson tries to change an exercise's answer mode
- **THEN** the change is rejected

### Requirement: Students build block-mode answers in a block editor
For an exercise in `blocks` mode, the exercise page SHALL show a block editor instead of the text editor, with a toolbox containing:
- typed variable declaration (`inteiro`, `real`, `cadeia`, `logico`) and assignment
- read (`leia`) and write (`escreva`)
- `se` / `senao`
- `enquanto`, `para`, `faca … enquanto`
- arithmetic, comparison and logical operators, and literals

Block labels SHALL be shown in the user's locale (pt-BR or en).

#### Scenario: Block editor shown for block exercise
- **WHEN** a student opens an exercise whose mode is `blocks`
- **THEN** the page shows the block editor with the toolbox above and no language selector

#### Scenario: Viewing the generated code
- **WHEN** a student opens the "view code" panel while building blocks
- **THEN** the panel shows, read-only, the Portugol program the current blocks generate, and updates as the blocks change

### Requirement: Block answers are graded as Portugol by the existing judge
On submit, the system SHALL store the block workspace as the submission's visual source, generate the Portugol program on the server from that workspace, and store the generated program as the submission's `code` with language Portugol. Code sent by the client SHALL NOT be used. The judge SHALL grade the submission exactly like any other Portugol submission.

#### Scenario: Correct block program passes
- **WHEN** a student submits blocks whose generated Portugol produces the expected output for every test case
- **THEN** the submission is graded `PASSED` by the judge and counts toward the exercise score like a code submission

#### Scenario: Client-sent code is ignored
- **WHEN** a submission for a `blocks` exercise arrives with a code value that does not match its workspace
- **THEN** the stored `code` is the program generated from the workspace, not the client-sent value

#### Scenario: Empty workspace
- **WHEN** a student submits a `blocks` exercise with no blocks placed
- **THEN** the submission is rejected before reaching the judge, with a message asking the student to add blocks

### Requirement: Solution constraints apply to the generated program
Structural and algorithm-requirement constraints on a `blocks` exercise SHALL be evaluated against the generated Portugol program, with the same outcomes as for code submissions.

#### Scenario: Forbidden loop nesting in blocks
- **WHEN** an exercise forbids nested loops and the student's blocks nest a `para` inside an `enquanto`
- **THEN** the submission resolves to `CONSTRAINT_VIOLATION` with the same explanation shown for code submissions

### Requirement: Block submissions are shown as blocks in history and review
Wherever a student's own submission history or the professor's lesson review shows a `blocks` submission, the system SHALL render its workspace as read-only blocks, with an option to view the generated code.

#### Scenario: Professor reviews a block submission
- **WHEN** the professor opens the lesson review for a student whose exercise answer is a `blocks` submission
- **THEN** the review shows the student's blocks read-only, and the professor can switch to the generated Portugol

### Requirement: AI hints for block answers refer to blocks
When a student requests AI help on a failed `blocks` submission, the hint SHALL refer to the blocks by the labels the student sees, and SHALL NOT tell the student to edit code syntax.

#### Scenario: Hint on failed block submission
- **WHEN** a student asks for AI help on a failed `blocks` submission
- **THEN** the returned hint talks about blocks (e.g. the "repeat while" block or a condition) rather than lines of Portugol code
