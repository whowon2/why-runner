## MODIFIED Requirements

### Requirement: Dissertation scopes the classroom evaluation honestly
`overleaf/main.tex` SHALL state that no classroom evaluation has been carried out yet: the in-app survey instrument (TCLE, four questionnaires, automatic SUS scoring, researcher results page) is built and integrated, and the first classroom test is scheduled for 29/10/2026, with no results reported. It SHALL NOT claim any contest, cohort, submission count or questionnaire result from students. Limitations SHALL note that every capability is implemented but not yet classroom-validated. `AUDITORIA_PRE_DEFESA.md` SHALL NOT claim a 23-student contest.

#### Scenario: Reader checks whether a trial happened
- **WHEN** a reader reads Current Validation Status, Evaluation Status and Limitations in `main.tex`
- **THEN** they SHALL learn that the instrument is ready, the test is scheduled for 29/10/2026, and no results exist yet

#### Scenario: Reader checks whether roadmap features were validated
- **WHEN** a reader reads Limitations in `main.tex`
- **THEN** it explicitly notes the roadmap/authoring/grading capabilities are implemented but pending classroom validation

#### Scenario: Audit file corrected
- **WHEN** `AUDITORIA_PRE_DEFESA.md` is searched for "23 alunos"
- **THEN** it SHALL only appear in a note marking that claim as false

## ADDED Requirements

### Requirement: Dissertation reflects verdicts, output comparison and checkers
`overleaf/main.tex` SHALL list the distinct verdicts (wrong answer, time limit, memory limit, compilation error, runtime error, judge error, constraint violation), note that compilation errors are not penalized in standings (ICPC practice) and that MLE is a heuristic, and SHALL describe the compare modes exact/tokens/float/checker and the checker protocol (`input.txt output.txt answer.txt`, exit 0/1/other).

#### Scenario: Verdict list
- **WHEN** a reader reads the Submission Pipeline section
- **THEN** the verdict list SHALL match the judge's `SubmissionStatus` values in use

### Requirement: Dissertation reflects concurrency, similarity, gradebook and CI
`overleaf/main.tex` SHALL describe the concurrent worker pool (with the benchmark table and the 1-vCPU production caveat), the code-similarity detector (tokenization, normalization, k-gram winnowing, greedy tiling, boilerplate filtering, owner-only on demand), the class gradebook with safe CSV export, and CI with enum-sync.

#### Scenario: Comparison table
- **WHEN** the Comparative Analysis table is read
- **THEN** it SHALL include rows or columns for plagiarism detection, distinct verdicts, gradebook and custom checkers

### Requirement: Dissertation has a benchmark-backed performance evaluation
`overleaf/main.tex` SHALL include a Performance Evaluation section with method, hardware, tables and figures whose every number comes from `bench/results/`, and SHALL compile with the SBC template.

#### Scenario: Compiles
- **WHEN** `latexmk -pdf main.tex` is run in `overleaf/` (TeX Live container)
- **THEN** it SHALL produce a PDF with no undefined references or citations
