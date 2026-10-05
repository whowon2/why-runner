## ADDED Requirements

### Requirement: Dissertation reflects visual answer modes
`overleaf/main.tex` SHALL describe the `blocks` and `parsons` answer modes for lesson exercises:
- what each mode asks of the student
- that both produce source code graded by the same judge
- that block answers become Portugol

It SHALL motivate the modes with the gradual progression from visual to text-based programming. `overleaf/apps-edu.tex` SHALL describe the same modes in Portuguese.

#### Scenario: Reader looks for how beginners answer exercises
- **WHEN** a reader reads the Class, Lesson, and Exercise Model section of `main.tex`
- **THEN** it explains the code, blocks, and Parsons answer modes and that all three are graded by the same judge pipeline

#### Scenario: Reader compares the two documents
- **WHEN** a reader who has read `main.tex` then reads `apps-edu.tex`
- **THEN** the Portuguese white paper describes the same visual answer modes
