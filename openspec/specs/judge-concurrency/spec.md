# judge-concurrency Specification

## Purpose
How the judge grades multiple jobs at once: a bounded, configurable worker pool with exclusive claiming, one isolate box per worker, notify/sweep wake-up, and an idle auto-stop that drains in-flight jobs before exiting.
## Requirements
### Requirement: Configurable bounded worker count
The judge SHALL process up to N jobs (submissions or problem validations) at once in a single process. N SHALL be read from the `JUDGE_CONCURRENCY` environment variable when it holds a positive integer, and SHALL be clamped to at most 64. When the variable is unset, empty, zero or unparsable, N SHALL default to the number of available CPUs, capped at 4.

#### Scenario: Explicit concurrency
- **WHEN** the judge starts with `JUDGE_CONCURRENCY=3`
- **THEN** at most 3 jobs SHALL be graded at the same time

#### Scenario: Default on a single-CPU VM
- **WHEN** the judge starts without `JUDGE_CONCURRENCY` on a host with 1 available CPU
- **THEN** it SHALL grade one job at a time, as before this change

#### Scenario: Invalid value
- **WHEN** `JUDGE_CONCURRENCY=abc` or `JUDGE_CONCURRENCY=0`
- **THEN** the judge SHALL fall back to the default worker count

### Requirement: Exclusive job claiming
Each submission or validation row SHALL be claimed by exactly one worker, across all workers in one process and across judge replicas. Concurrent claims SHALL skip rows another worker has locked rather than block on them.

#### Scenario: Two workers, one pending submission
- **WHEN** two idle workers try to claim at the same time and only one `PENDING` submission exists
- **THEN** exactly one worker SHALL receive it and the other SHALL receive nothing

#### Scenario: Burst of submissions
- **WHEN** 20 submissions become `PENDING` at once with N = 4
- **THEN** every submission SHALL be graded exactly once

### Requirement: Isolated sandbox per worker
Jobs running at the same time SHALL never use the same isolate box id. Box ids that workers use SHALL NOT overlap with ids handed out to sandbox runs outside a worker (e.g. tests).

#### Scenario: Concurrent compiles
- **WHEN** two workers compile C submissions at the same time
- **THEN** each compile SHALL run in a different isolate box, and each submission SHALL get its own correct verdict

### Requirement: Wake-up on notification and periodic sweep
Idle workers SHALL wake to claim work when a `new_submission` or `new_validation` notification arrives, and at least every 60 seconds even without a notification. A notification that arrives while a worker is between its last empty claim and going to sleep SHALL NOT be lost. Stuck `RUNNING` submissions that exhausted their retries SHALL still be dead-lettered before reclaiming runs.

#### Scenario: Notification wakes an idle pool
- **WHEN** all workers are idle and web sends `pg_notify('new_submission', ...)`
- **THEN** a worker SHALL claim and grade the new submission without waiting for the 60 s sweep

#### Scenario: Missed notification
- **WHEN** a submission becomes `PENDING` without a notification
- **THEN** a worker SHALL pick it up within the next periodic sweep

### Requirement: Idle auto-stop with graceful drain
When `JUDGE_IDLE_EXIT_SECS` is set, the judge SHALL exit only after no worker has processed a job for that long and no job is in progress. Before exiting it SHALL stop claiming new jobs and let any in-progress job finish and save its result.

#### Scenario: Busy worker blocks idle exit
- **WHEN** the idle timeout elapses since the last finished job but one worker is still grading
- **THEN** the judge SHALL NOT exit until that job's result is saved and the timeout elapses again with nothing in progress

#### Scenario: Idle pool exits
- **WHEN** no job is claimed or running for `JUDGE_IDLE_EXIT_SECS` seconds
- **THEN** the judge SHALL exit with success, leaving no row it claimed in `RUNNING`

