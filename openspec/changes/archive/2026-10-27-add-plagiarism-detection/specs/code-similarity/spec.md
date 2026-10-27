## ADDED Requirements

### Requirement: Tokens are normalized per language
The similarity engine SHALL tokenize source code per submission language (`c`, `cpp`, `java`, `python`, `portugol`, `rust`). It SHALL drop whitespace and comments, drop C/C++ preprocessor lines and Java `package`/`import` lines, and replace every identifier that is not a language keyword with one placeholder token, every numeric literal with one placeholder, and every string or character literal with one placeholder. Keywords, operators and punctuation SHALL be kept. Each token SHALL keep its start and end character offset in the original source.

#### Scenario: Renamed variables and reformatting
- **WHEN** submission B is submission A with every variable renamed, comments added, and indentation/line breaks changed
- **THEN** both SHALL produce the same token sequence and their similarity SHALL be 100%

#### Scenario: Comments do not count
- **WHEN** two programs differ only in comments (`//`, `/* */`, or `#` in Python)
- **THEN** their token sequences SHALL be equal

#### Scenario: Unknown or missing language
- **WHEN** a submission has no language
- **THEN** it SHALL be tokenized with the C-family rules and still be compared only against other submissions with no language

### Requirement: Fingerprints use k-gram winnowing
The engine SHALL hash every run of `k` consecutive tokens (default `k = 5`) and select fingerprints by winnowing with window `w` (default `w = 4`): in each window of `w` consecutive k-gram hashes, the minimum hash (rightmost on ties) is selected, each selected position once. Any shared run of at least `w + k − 1` tokens SHALL therefore yield at least one shared fingerprint. Programs with fewer than `k` tokens SHALL have no fingerprints and SHALL score 0 against everything.

#### Scenario: Long shared run is always detected
- **WHEN** two otherwise unrelated programs share an identical run of 8 normalized tokens
- **THEN** they SHALL share at least one fingerprint and the run SHALL appear as a matched region

#### Scenario: Tiny program
- **WHEN** a submission has 3 tokens
- **THEN** its similarity to any submission SHALL be 0 and no regions SHALL be reported

### Requirement: Pair similarity and matched regions
For a pair (A, B) the engine SHALL find matched regions by greedy tiling seeded from shared fingerprints: candidate matches are extended forward while normalized tokens are equal, accepted longest first, and never overlap an already accepted region on either side; regions shorter than `k` tokens SHALL be discarded. It SHALL report `coverageA` and `coverageB` (matched tokens / total tokens of each side) and `similarity = (matchedA + matchedB) / (tokensA + tokensB)`, each in [0, 1]. Each region SHALL be returned as a pair of character ranges (one in A, one in B) so the UI can highlight them side by side.

#### Scenario: Identical programs
- **WHEN** A and B are byte-identical
- **THEN** similarity, coverageA and coverageB SHALL be 1 and one region SHALL cover all tokens of both

#### Scenario: Partial copy
- **WHEN** B contains A's whole solution plus an equally long unrelated function
- **THEN** coverageA SHALL be close to 1, coverageB close to 0.5, and similarity between them

#### Scenario: Symmetry
- **WHEN** comparing (A, B) and (B, A)
- **THEN** similarity SHALL be equal and regions SHALL be the same with sides swapped

### Requirement: Boilerplate shared by most students is ignored
When building a report over a set of submissions, the engine SHALL ignore any fingerprint hash that appears in more than a threshold share of the compared submissions in the same language (default: more than 50% of them, only applied when at least 4 submissions of that language are compared), so that code every student writes (`int main`, read-input skeleton) does not inflate scores.

#### Scenario: Common skeleton
- **WHEN** 10 students all start with the same `scanf`/`printf` skeleton and otherwise write different code
- **THEN** the skeleton SHALL not produce matched regions and their pair similarities SHALL stay low

### Requirement: One submission per student is compared
Reports SHALL pick exactly one submission per student, chosen by a `pick` mode: `latest` (most recent submission) or `best` (most recent `PASSED` submission; otherwise the one with the highest passed-test fraction, latest on ties; otherwise the latest). `PENDING` and `RUNNING` submissions SHALL be ignored. Only pairs of different students who used the same language SHALL be compared. The professor's own submissions SHALL be excluded.

#### Scenario: Best mode prefers a passing submission
- **WHEN** a student has a PASSED submission followed by a later FAILED one, and pick is `best`
- **THEN** the PASSED submission SHALL be compared

#### Scenario: Different languages are not paired
- **WHEN** student X submitted Python and student Y submitted C
- **THEN** the report SHALL contain no (X, Y) pair

### Requirement: Professor-only exercise similarity report
`getExerciseSimilarity` SHALL authenticate the caller, parse its input with a zod schema (`exerciseId` uuid, `pick` enum), and throw unless the caller is the owner of the exercise's lesson. It SHALL compare submissions whose `exerciseId` is that exercise. It SHALL return a `PARSONS_NOT_SUPPORTED` action failure for `parsons` exercises (every answer is a reordering of the same lines). It SHALL return students with `publicUserColumns` only, each picked submission's id, language, status, created time and `code`, and SHALL NOT return `submission.output`. Nothing SHALL be written to the database.

#### Scenario: Student calls the action
- **WHEN** a class member who is not the lesson owner calls `getExerciseSimilarity`
- **THEN** the action SHALL throw and return no submissions

#### Scenario: Owner gets ranked pairs
- **WHEN** the lesson owner calls it for an exercise with submissions from 3 students in the same language
- **THEN** it SHALL return 3 pairs sorted by similarity descending, each with both students, both percentages and matched regions

### Requirement: Professor-only contest problem similarity report
`getContestProblemSimilarity` SHALL authenticate the caller, parse `contestId`, `problemId` (uuid) and `pick` with zod, and throw unless the caller is the contest owner and the problem is attached to the contest. It SHALL compare submissions with that `contestId` and `problemId`, with the same picking, output and redaction rules as the exercise report.

#### Scenario: Non-owner calls the action
- **WHEN** a contest participant calls `getContestProblemSimilarity`
- **THEN** the action SHALL throw

#### Scenario: Problem not in contest
- **WHEN** the owner passes a `problemId` not attached to the contest
- **THEN** the action SHALL throw

### Requirement: Reports are bounded
Each report SHALL compare at most 300 picked submissions (most recent first) and return at most 500 pairs, keeping the highest similarities, and SHALL say when either cap was hit.

#### Scenario: Large contest
- **WHEN** a problem has picked submissions from 400 students
- **THEN** the report SHALL compare the 300 most recent and flag that it was truncated

### Requirement: Similarity report page
The exercise and contest similarity pages SHALL be reachable only by the owning professor (others get not-found or the action's error), use the shared page header, and show: a latest/best toggle and a minimum-similarity threshold (both in the URL), a list of pairs above the threshold with both students' names, language, similarity % and per-side %, and, when a pair is selected, the two programs side by side with each matched region highlighted in the same color on both sides. The contest page SHALL have a problem picker in the URL. The professor's lesson exercise list and contest management tab SHALL link to these pages.

#### Scenario: Selecting a pair
- **WHEN** the professor clicks a pair in the list
- **THEN** the side-by-side view SHALL open with matched regions highlighted, region i using the same color in both columns

#### Scenario: No suspicious pairs
- **WHEN** no pair reaches the threshold
- **THEN** the page SHALL show an empty state instead of the list
