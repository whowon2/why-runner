# custom-run Specification

## Purpose
TBD - created by archiving change custom-run. Update Purpose after archive.
## Requirements
### Requirement: Run with custom input in every code editor
Every code editor where a user submits a solution SHALL offer a "Run" action next to Submit, with a stdin textarea: the problem workspace's Submit tab, the contest problem upload view, and the lesson exercise view in `code` and `blocks` mode. Run SHALL execute the editor's current program once with the textarea's content as stdin. In `blocks` mode the program SHALL be the Portugol generated from the current workspace, regenerated on the server. Parsons exercises SHALL NOT offer Run.

#### Scenario: Running code with custom input
- **WHEN** a student types `3 4` into the input box of a problem's Submit tab and clicks Run with a Python program that prints the sum
- **THEN** the result panel shows status OK, exit code 0, stdout `7`, the run time and peak memory

#### Scenario: Empty input
- **WHEN** a student clicks Run with an empty input box
- **THEN** the program runs with empty stdin

#### Scenario: Blocks exercise
- **WHEN** a student clicks Run on a `blocks` exercise
- **THEN** the server generates Portugol from the submitted workspace and runs that, ignoring any client-sent code

#### Scenario: Parsons exercise
- **WHEN** a student opens a `parsons` exercise
- **THEN** no Run action is shown

#### Scenario: No language chosen
- **WHEN** a user clicks Run before selecting a language
- **THEN** the system warns that a language must be selected and creates no run

### Requirement: Run result shows raw execution data only
A finished run SHALL show its status, exit code, stdout, stderr, run time in ms (measured as for graded submissions) and peak memory in KB. Status SHALL be one of `OK` (exit 0), `RUNTIME_ERROR`, `TIME_LIMIT_EXCEEDED`, `MEMORY_LIMIT_EXCEEDED`, `COMPILATION_ERROR` (compiler output in stderr) or `ERROR` (judge-side fault). The result SHALL NOT contain any expected output, comparison, verdict such as `PASSED`/`WRONG_ANSWER`, or test case data. While the run is `PENDING` or `RUNNING` the panel SHALL show a progress state and poll until it finishes.

#### Scenario: Compile error
- **WHEN** a student runs C code that does not compile
- **THEN** the panel shows status COMPILATION_ERROR and the compiler output, and no stdout

#### Scenario: Infinite loop
- **WHEN** a student runs a program that never terminates
- **THEN** the run ends with TIME_LIMIT_EXCEEDED after the same CPU limit a graded submission of that program would get

#### Scenario: Waiting for a sleeping judge
- **WHEN** the judge machine is stopped and a student clicks Run
- **THEN** the panel shows the run as pending until the woken judge finishes it, without the student clicking again

### Requirement: Runs never affect grading or progress
A run SHALL NOT create, modify or be counted as a submission. Runs SHALL NOT affect scores, the gradebook, exercise completion, lesson submissions, contest standings (`user_on_contest.answered`), AI help, code similarity, problem statistics or the submission rate limit. Runs SHALL be stored only in the `code_run` table, never in `submission`.

#### Scenario: Run then check standings
- **WHEN** a contest participant runs a correct solution with custom input
- **THEN** the leaderboard, their submissions list and the problem's solved state are unchanged

#### Scenario: Run does not consume submission budget
- **WHEN** a student makes 5 runs and then submits within 30 seconds
- **THEN** the submission is accepted (the submission rate limit counts only submissions)

### Requirement: Runs never reveal tests
Executing a run SHALL NOT read the problem's test inputs, outputs, visibility flags or custom checker; the only problem data a run uses SHALL be its time limit. The run input box MAY be prefilled only with an example input that the page already shows to that user.

#### Scenario: Hidden tests stay hidden
- **WHEN** a student runs code on a problem whose tests are all hidden
- **THEN** neither the run request, its stored row nor the result contains any test input or output

### Requirement: Run uses the grading sandbox and limits
A run SHALL execute in the same isolate sandbox, with the same per-language compile step, memory cap, process cap, no network access and Portugol input normalization as graded submissions. Its CPU limit SHALL be the one a graded submission gets for that language and problem time limit. A run with no problem context SHALL NOT exist (every run is tied to a problem).

#### Scenario: Same limit as grading
- **WHEN** a problem has a 1000 ms time limit and a student runs Python code on it
- **THEN** the run's CPU limit is the same scaled limit a graded Python submission on that problem gets

#### Scenario: No network in runs
- **WHEN** a run's program tries to open a network connection
- **THEN** the connection fails as it does in graded submissions

### Requirement: Run access mirrors submit access
Creating a run SHALL require a signed-in user with the same access the matching submit action requires: for a contest problem, an accepted participant of a published, started contest that lists the problem and has runs allowed; for a lesson exercise, a member of its class; for a standalone problem, a problem the user can see. A run SHALL be readable only by the user who created it. Unlike submissions, a passed lesson due date or an already-solved contest problem SHALL NOT block runs.

#### Scenario: Reading someone else's run
- **WHEN** a user requests a run id that belongs to another user
- **THEN** the system refuses and returns no run data

#### Scenario: Contest not started
- **WHEN** a participant tries to run code on a contest problem before the contest starts
- **THEN** the system refuses with the same "contest not started" error a submission gets

#### Scenario: After the due date
- **WHEN** a student runs code on a lesson exercise after the lesson's due date
- **THEN** the run executes normally and no submission is created

### Requirement: Contests can disable runs
A contest SHALL have an "allow custom runs" setting, on by default. When it is off, contest problem views SHALL NOT show the Run action, and the run action SHALL refuse runs for that contest's problems with a `RUNS_DISABLED` error.

#### Scenario: Runs disabled
- **WHEN** the contest creator turns off custom runs and a participant calls the run action for a problem of that contest
- **THEN** the action fails with `RUNS_DISABLED` and no run row is created

### Requirement: Run abuse limits
The system SHALL refuse a run when the user already has 10 runs in the last 60 seconds (`RATE_LIMITED`), when the user has a run still `PENDING` or `RUNNING` that is less than 2 minutes old (`RUN_IN_PROGRESS`), when stdin exceeds 64 KiB (`INPUT_TOO_LARGE`), or when the program exceeds the submission code limit (`CODE_TOO_LARGE`). The judge SHALL store at most 64 KiB of stdout and 64 KiB of stderr per run, marking each as truncated when it cut output, and the UI SHALL say when output was truncated.

#### Scenario: Eleventh run in a minute
- **WHEN** a user has created 10 runs in the last 60 seconds and clicks Run again
- **THEN** the action fails with `RATE_LIMITED` and the UI shows a localized "too many runs" message

#### Scenario: Large output
- **WHEN** a program prints 1 MB to stdout
- **THEN** the stored stdout holds the first 64 KiB, `stdout_truncated` is true, and the panel says the output was cut

### Requirement: Run retention and stuck runs
The judge SHALL mark a run `ERROR` when it has been `RUNNING` for more than 2 minutes (no retries), and SHALL delete runs created more than 24 hours ago during its periodic sweep. Pending runs SHALL count as claimable work, so the judge's idle auto-stop never exits with a run pending.

#### Scenario: Old runs deleted
- **WHEN** the judge sweeps and a run is 25 hours old
- **THEN** that run row is deleted

#### Scenario: Idle stop waits for runs
- **WHEN** the idle timeout has elapsed but a run is `PENDING`
- **THEN** the judge does not exit and executes the run

### Requirement: Rollout gate
The Run UI and the run action SHALL be enabled only when the web's `CUSTOM_RUN_ENABLED` environment variable is `true`. When disabled, no Run button is rendered and the action fails with `RUNS_DISABLED`, so a judge version without run support never receives runs.

#### Scenario: Gate off
- **WHEN** `CUSTOM_RUN_ENABLED` is unset
- **THEN** no editor shows a Run button and no `code_run` row can be created

