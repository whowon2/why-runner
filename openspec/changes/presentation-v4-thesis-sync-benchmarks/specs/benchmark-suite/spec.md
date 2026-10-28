## ADDED Requirements

### Requirement: Benchmarks are reproducible scripts with committed raw results
Each benchmark SHALL be a script under `bench/` that writes its raw measurements to `bench/results/` as CSV or JSON, and a chart script SHALL regenerate every chart in `docs/presentation/charts/` from those files alone. `bench/README.md` SHALL record the hardware (CPU model, cores/threads, RAM, OS/kernel), tool versions, and the exact command to re-run each benchmark.

#### Scenario: Re-running charts
- **WHEN** `python3 bench/charts.py` is run on a clean checkout
- **THEN** every chart used in the deck and thesis SHALL be regenerated from `bench/results/` without touching a database or API

#### Scenario: Hardware documented
- **WHEN** a reader opens `bench/README.md`
- **THEN** it SHALL state the CPU model, core/thread count, RAM and OS, and the re-run command for each benchmark

### Requirement: Every reported number traces to a result file
Every number shown in the v4 deck or in `overleaf/main.tex` that claims a measurement SHALL be present in (or directly computed from) a file in `bench/results/`. `bench/results/summary.json` SHALL hold the headline numbers that the deck and thesis quote.

#### Scenario: Auditing a slide number
- **WHEN** a slide states a speedup, latency, accuracy or count
- **THEN** the same value SHALL be found in `bench/results/summary.json` or the benchmark's raw file

### Requirement: Benchmarks never write to the production database
Benchmarks that insert or update rows SHALL use a throwaway local Postgres container created by the bench scripts. Any query against the production (Neon) database SHALL run with `default_transaction_read_only=on` and SHALL NOT update submission rows.

#### Scenario: Concurrency burst
- **WHEN** the concurrency benchmark inserts a burst of submissions
- **THEN** the inserts SHALL go to the bench container's database, never to the URL in `web/.env`

#### Scenario: Historical re-grade
- **WHEN** the compare-mode benchmark reads historical failed submissions
- **THEN** it SHALL only SELECT, in a read-only session, and re-grade offline

### Requirement: AI benchmarks are small and counted
AI benchmarks SHALL make at most 20 calls per measure and SHALL record the total number of API calls made, per model, in their result file.

#### Scenario: Call count reported
- **WHEN** the AI benchmark finishes
- **THEN** its result file SHALL list the call count per feature and per model that answered

### Requirement: Benchmark coverage
The suite SHALL cover, at minimum: judge concurrency (N = 1, 2, 4, 8; bursts of 40 and 100; throughput and p50/p95 latency), end-to-end stage latency, per-language compile/run time and peak memory, sandbox overhead (bare vs isolate), verdict classification accuracy (confusion matrix over AC/WA/TLE/MLE/CE/RE × 6 languages), compare-mode re-grade of historical failures, plagiarism detection quality (per obfuscation level, threshold, precision/recall/ROC) and performance (N = 10–200 students), structural-constraint false-positive rate, AI latency/pass rate/fallback rate, web standings/gradebook computation time, and CI job durations. Results that are weak or negative (e.g. MLE accuracy, no gain on 1 vCPU) SHALL be reported as measured.

#### Scenario: Weak result kept
- **WHEN** MLE classification accuracy is below the other verdicts
- **THEN** the confusion matrix SHALL show the measured value and the thesis SHALL list it as a limitation
