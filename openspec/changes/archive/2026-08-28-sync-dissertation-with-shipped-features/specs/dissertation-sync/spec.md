## ADDED Requirements

### Requirement: Dissertation reflects the Classes/Lessons/Exercises authoring model
`overleaf/main.tex` SHALL describe WhyRunner's professor-curated Classes → Lessons → Exercises → Assignments model as a capability of the system, alongside the pre-existing contest mode, in the System Design section.

#### Scenario: Reader looks for the roadmap/authoring capability
- **WHEN** a reader reads the System Design section of `main.tex`
- **THEN** it explains that a professor assembles Lessons from Exercises into a Class roadmap, assigns them to students, and that this coexists with (does not replace) the contest mode

### Requirement: Dissertation reflects AI-assisted authoring capabilities
`overleaf/main.tex` SHALL describe, in addition to the existing student-facing hint feedback, the AI-assisted reference-solution drafting, AI problem review, and AI-generated narrative flavor text capabilities available to professors during problem authoring.

#### Scenario: Reader looks for AI capabilities beyond hint feedback
- **WHEN** a reader reads the AI section of `main.tex`
- **THEN** it lists hint feedback, AI-drafted reference solutions, AI problem review, and narrative flavor text as distinct Gemini-backed capabilities, each with what input it takes and what it produces

### Requirement: Dissertation reflects pre-publish validation and solution-constraint enforcement
`overleaf/main.tex` SHALL describe pre-publish I/O validation (a reference solution must pass the judge sandbox before a problem can be published, and edits to I/O invalidate a prior pass) and solution-constraint enforcement (forbidden constructs / required-algorithm checks applied to student submissions) as implemented capabilities, not future work.

#### Scenario: Reader checks Future Work against what's implemented
- **WHEN** a reader reads Limitations/Future Work in `main.tex`
- **THEN** pre-publish validation and solution-constraint enforcement no longer appear as unimplemented future work, and are instead described in System Design

### Requirement: Dissertation reflects per-exercise grading and notifications
`overleaf/main.tex` SHALL describe assignment scores as derived from per-exercise judge results (rather than a single aggregate verdict), and SHALL describe the in-app notifications system and the confirm-before-submit flow for assignments with unsolved exercises.

#### Scenario: Reader looks for how assignment scores are computed
- **WHEN** a reader reads the Submission Lifecycle or System Design section of `main.tex`
- **THEN** it states that an assignment's score is composed from individual exercise pass/fail results from the judge, not one aggregate pass/fail

### Requirement: Dissertation scopes the classroom evaluation honestly
`overleaf/main.tex` SHALL NOT imply that the classroom contest trial (Evaluation/Results) validated the Classes/Lessons/Exercises roadmap, AI-assisted authoring, solution-constraint enforcement, or per-exercise grading; it SHALL state plainly that trial covered the contest + hint-feedback path only, and that the newer capabilities are implemented but not yet classroom-validated.

#### Scenario: Reader checks whether roadmap features were validated
- **WHEN** a reader reads Limitations in `main.tex`
- **THEN** it explicitly notes the roadmap/authoring/grading capabilities are implemented but pending classroom validation

### Requirement: Portuguese white paper stays consistent with the thesis
`overleaf/apps-edu.tex` SHALL be updated so its Diferenciais, Aspectos Tecnológicos, and Arquitetura resumida sections describe the same capability set as the updated `main.tex` (Classes/Lessons/Exercises, AI-assisted authoring, pre-publish validation, solution constraints, per-exercise grading, notifications), in Portuguese.

#### Scenario: Reader compares the two documents
- **WHEN** a reader who has read `main.tex` then reads `apps-edu.tex`
- **THEN** the set of described capabilities matches (accounting for language), with no capability present in one document and silently absent from the other
