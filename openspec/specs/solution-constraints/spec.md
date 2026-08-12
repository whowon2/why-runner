## Purpose

Defines authoring and enforcement of solution constraints — structural rules and an algorithm-requirement — that a problem creator can attach to a problem, checked in addition to normal test-case I/O correctness, so that a submission can pass all test cases yet still be denied credit for using a disallowed approach.

## Requirements

### Requirement: Authoring structural constraints on a problem
The problem edit workspace SHALL let the creator of a problem attach zero or more structural constraints from a fixed catalog of rule types (e.g. maximum loop nesting depth, forbidden constructs/builtins), each with creator-supplied parameters, and SHALL let the creator remove or edit them like any other draft field.

#### Scenario: Creator adds a structural constraint
- **WHEN** the creator selects a structural rule type and supplies its parameters (e.g. max loop nesting depth of 1), then saves the problem
- **THEN** the constraint is persisted alongside the problem and applies to future submission grading

#### Scenario: Creator removes a structural constraint
- **WHEN** the creator removes a previously added structural constraint and saves
- **THEN** future submissions are no longer checked against that constraint

### Requirement: Authoring an algorithm-requirement constraint on a problem
The problem edit workspace SHALL let the creator declare at most one algorithm-requirement constraint per problem (e.g. "must use Dijkstra"), stored as a short natural-language description of the required algorithm/technique that is later used as AI classification criteria.

#### Scenario: Creator adds an algorithm-requirement constraint
- **WHEN** the creator enters a required-algorithm description and saves the problem
- **THEN** the description is persisted alongside the problem and applies to future submission grading

#### Scenario: Only one algorithm-requirement constraint allowed
- **WHEN** the creator attempts to add a second algorithm-requirement constraint to the same problem
- **THEN** the system SHALL reject the addition and indicate only one is allowed per problem

### Requirement: Structural constraints are checked via judge-side static analysis
For a submission to a problem with active structural constraints, once the submission passes all declared test cases, the judge SHALL run static analysis over the submitted source, per submission language, to check each structural constraint before finalizing the submission's result.

#### Scenario: Submission violates a structural constraint
- **WHEN** a submission passes all test cases but its source violates a structural constraint (e.g. exceeds the declared max loop nesting depth)
- **THEN** the system SHALL mark the submission with a constraint-violation outcome distinct from `PASSED` and from a normal `FAILED`/`ERROR` outcome, and SHALL indicate which structural constraint was violated

#### Scenario: Submission satisfies all structural constraints
- **WHEN** a submission passes all test cases and its source satisfies every structural constraint on the problem
- **THEN** static analysis alone does not block the submission from being marked `PASSED` (subject to any algorithm-requirement check also passing)

#### Scenario: Problem has no structural constraints
- **WHEN** a problem has no structural constraints configured
- **THEN** the judge SHALL skip structural static analysis for submissions to that problem

### Requirement: Algorithm-requirement constraints are checked via AI classification
For a submission to a problem with an active algorithm-requirement constraint, once the submission passes all test cases and any structural constraints, the system SHALL classify whether the submitted source satisfies the required algorithm/technique using an LLM call, before finalizing the submission as `PASSED`.

#### Scenario: Submission enters pending classification after passing I/O and structural checks
- **WHEN** a submission to a problem with an algorithm-requirement constraint passes all test cases and all structural constraints
- **THEN** the system SHALL set the submission to a pending-classification state and SHALL NOT yet mark it `PASSED`

#### Scenario: Classification confirms the required algorithm was used
- **WHEN** the AI classification pass determines the submitted source satisfies the problem's algorithm-requirement constraint
- **THEN** the system SHALL mark the submission `PASSED`

#### Scenario: Classification determines the required algorithm was not used
- **WHEN** the AI classification pass determines the submitted source does not satisfy the problem's algorithm-requirement constraint
- **THEN** the system SHALL mark the submission with a constraint-violation outcome distinct from `PASSED` and from a normal `FAILED`/`ERROR` outcome, and SHALL show the classification's rationale to the student

#### Scenario: Problem has no algorithm-requirement constraint
- **WHEN** a problem has no algorithm-requirement constraint configured
- **THEN** the system SHALL skip AI classification for submissions to that problem and finalize based on I/O and structural checks alone

### Requirement: Constraint violations do not award leaderboard/contest credit
A submission marked with a constraint-violation outcome SHALL NOT be treated as a passing submission for contest leaderboard credit or per-user problem completion, even though it produced correct output for every test case.

#### Scenario: Constraint-violating submission does not credit the leaderboard
- **WHEN** a submission in a contest violates an active structural or algorithm-requirement constraint after passing all test cases
- **THEN** the system SHALL NOT record it as an answered/solved problem on the contest leaderboard

### Requirement: Students see why a constraint-violating submission did not pass
The submission result view SHALL distinguish a constraint-violation outcome from wrong-answer and error outcomes, and SHALL indicate which constraint (structural rule or algorithm requirement) was violated.

#### Scenario: Viewing a structural constraint violation
- **WHEN** a student views the result of a submission that violated a structural constraint
- **THEN** the system SHALL show that the code passed all test cases but violated the named structural constraint

#### Scenario: Viewing an algorithm-requirement violation
- **WHEN** a student views the result of a submission that violated the algorithm-requirement constraint
- **THEN** the system SHALL show that the code passed all test cases but did not satisfy the required algorithm, along with the classification's rationale
