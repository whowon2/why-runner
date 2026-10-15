## ADDED Requirements

### Requirement: Judge enforces the problem's time limit on execution
For each test case run of a submission, the judge SHALL apply a CPU time limit derived from the problem's `time_limit_ms`, scaled by a per-language factor plus a fixed per-language startup allowance. It SHALL NOT use a hardcoded constant. Exceeding it SHALL produce a time-limit verdict whose message states the effective limit.

#### Scenario: Slow C++ solution
- **WHEN** a C++ submission takes 3s of CPU on a test for a problem with `time_limit_ms = 1000`
- **THEN** the judge SHALL report time limit exceeded on that test

#### Scenario: Fast solution unaffected
- **WHEN** a Python submission takes 200ms on every test for a problem with `time_limit_ms = 1000`
- **THEN** the judge SHALL grade it by output as before

### Requirement: Compilation is separate from execution
For compiled languages (C, C++, Rust, Java), the judge SHALL compile once per submission in its own sandbox step, with a fixed compile time limit. Compile time SHALL NOT count against the per-test execution limit. A compile failure SHALL stop grading with a compile-error verdict, as before. Languages whose toolchain compiles inside the run command (Portugol) or that are interpreted (Python) SHALL get their startup cost through the per-language allowance instead.

#### Scenario: Slow compile, fast run
- **WHEN** a Rust submission takes 8s to compile and 50ms per test, for a problem with `time_limit_ms = 1000`
- **THEN** the submission SHALL be graded by output, not reported as time limit exceeded

#### Scenario: Compiled once
- **WHEN** a C submission is graded against 10 test cases
- **THEN** the compiler SHALL run once, not 10 times
