## ADDED Requirements

### Requirement: Contest leaderboard refreshes on participant and problem changes
Joining or leaving a contest, approving or rejecting a pending join, and adding, removing, or reordering contest problems SHALL invalidate that contest's leaderboard query (`["contest-leaderboard", contestId]`), with the invalidation living in the mutation hook (or the single mutation call site when there is no hook).

#### Scenario: Approved participant appears on the leaderboard
- **WHEN** the owner approves a pending join request
- **THEN** the contest leaderboard refetches and lists the newly accepted participant

#### Scenario: Leaving removes the row
- **WHEN** a participant leaves the contest
- **THEN** the contest leaderboard refetches without their row
