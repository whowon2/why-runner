## MODIFIED Requirements

### Requirement: Gradebook can be exported as CSV
The class owner SHALL be able to download the gradebook as a CSV file containing one header row and one row per student with: student name, username, one column per exercise (headed by lesson and problem title), one subtotal column per lesson, the overall total, and the maximum possible total. Scores SHALL be written as decimals with a dot separator; not-submitted cells SHALL be empty. The file SHALL be RFC 4180 (every field quoted, embedded quotes doubled, CRLF rows), start with a UTF-8 BOM, and neutralise cells starting with formula characters (`= + - @`). The gradebook's export control SHALL offer two choices: this scores CSV, and the detailed results CSV defined by `class-results-export`.

#### Scenario: Download CSV
- **WHEN** the owner opens the export menu on the gradebook and chooses the scores export
- **THEN** the browser SHALL download a `.csv` file whose rows match the gradebook on screen

#### Scenario: Choose detailed results
- **WHEN** the owner opens the export menu on the gradebook and chooses the detailed results export
- **THEN** the browser SHALL download the class's detailed results CSV

#### Scenario: Student name looks like a formula
- **WHEN** a student's name starts with `=`
- **THEN** the exported cell SHALL be prefixed so spreadsheet apps do not evaluate it
