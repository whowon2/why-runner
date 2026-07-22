# lesson-requirements

## Purpose

Gate lessons behind minimum theme/language skill thresholds, computing a per-user locked/unlocked state and surfacing lesson rewards, so the roadmap functions as a quest progression on top of the existing lesson pipeline.

## Requirements

### Requirement: Lesson requirements declare minimum skill thresholds
A lesson MAY declare zero or more requirements, each a minimum value on a single theme skill or a single language skill. A lesson with no requirements SHALL be unlocked for every user.

#### Scenario: Lesson with theme requirements
- **WHEN** a lesson is created requiring `strings` level 20 and `arrays` level 15
- **THEN** the system records both requirements against the lesson

#### Scenario: Lesson with no requirements
- **WHEN** a lesson is created without any requirement
- **THEN** the system treats that lesson as unlocked for all users regardless of their skill values

### Requirement: Lesson locked state is computed from user skills
For a given user, a lesson SHALL be considered locked if the user's current value for any of the lesson's required theme or language skills is below that requirement's minimum value. A lesson is unlocked if the user meets or exceeds every requirement.

#### Scenario: User meets all requirements
- **WHEN** a lesson requires `strings` level 20 and the user's `strings` skill value is 25
- **THEN** the lesson is unlocked for that user

#### Scenario: User misses one requirement
- **WHEN** a lesson requires `strings` level 20 and `arrays` level 15, and the user's `strings` skill value is 25 but `arrays` skill value is 10
- **THEN** the lesson is locked for that user

#### Scenario: User with no skill history
- **WHEN** a lesson requires `loops` level 5 and a user has never earned any `loops` skill
- **THEN** the user's `loops` skill value is treated as 0 and the lesson is locked

### Requirement: Locked lessons reject submission
The system SHALL reject a submission attempt against a lesson the current user has not unlocked, without creating a submission row or invoking the judge.

#### Scenario: Submitting to a locked lesson
- **WHEN** a user attempts to submit code for a lesson whose requirements they do not meet
- **THEN** the system rejects the submission with an error and does not create a submission row

#### Scenario: Submitting to an unlocked lesson
- **WHEN** a user attempts to submit code for a lesson whose requirements they meet (or that has no requirements)
- **THEN** the system accepts the submission and proceeds through the normal judged pipeline

### Requirement: Lesson rewards are visible before completion
The system SHALL display, for each lesson, the skill rewards a user earns on first pass: +1 to each of the lesson's tagged themes, and +1 to the skill of whichever language the passing submission is written in.

#### Scenario: Viewing a lesson's rewards
- **WHEN** a user views a lesson tagged with `strings` and `conditionals`
- **THEN** the system displays that completing it rewards +1 `strings` skill and +1 `conditionals` skill, plus +1 skill in whichever language the user submits in
