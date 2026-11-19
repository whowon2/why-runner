## MODIFIED Requirements

### Requirement: Run result shows raw execution data only
A finished run SHALL show its status, exit code, stdout, stderr, run time in ms (measured as for graded submissions) and peak memory in KB. Status SHALL be one of `OK` (exit 0), `RUNTIME_ERROR`, `TIME_LIMIT_EXCEEDED`, `MEMORY_LIMIT_EXCEEDED`, `COMPILATION_ERROR` (compiler output in stderr) or `ERROR` (judge-side fault). The result SHALL NOT contain any expected output, comparison, verdict such as `PASSED`/`WRONG_ANSWER`, or test case data. While the run is `PENDING` or `RUNNING` the panel SHALL show a progress state and poll it on the `judge-result-polling` schedule; once that schedule stops (5 minutes pending) the panel SHALL show the "still judging" state with Check again and Cancel. Playing visible examples SHALL wait for each run on the same schedule and limit.

#### Scenario: Compile error
- **WHEN** a student runs C code that does not compile
- **THEN** the panel shows status COMPILATION_ERROR and the compiler output, and no stdout

#### Scenario: Infinite loop
- **WHEN** a student runs a program that never terminates
- **THEN** the run ends with TIME_LIMIT_EXCEEDED after the same CPU limit a graded submission of that program would get

#### Scenario: Waiting for a sleeping judge
- **WHEN** the judge machine is stopped and a student clicks Run
- **THEN** the panel shows the run as pending until the woken judge finishes it, without the student clicking again

#### Scenario: Judge never picks the run up
- **WHEN** a run stays `PENDING` for 5 minutes
- **THEN** the panel stops polling and shows "still judging" with Check again and Cancel, and an examples Play batch stops waiting on it
