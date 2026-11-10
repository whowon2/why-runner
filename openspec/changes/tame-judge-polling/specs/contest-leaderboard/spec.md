## MODIFIED Requirements

### Requirement: Live refresh while running
While the contest is running (started and not yet ended), the leaderboard SHALL refresh its standings automatically at a fixed interval of at most 15 seconds. Once the contest has ended, or before it has started, it SHALL NOT poll. In addition, when the viewer's own submission in that contest gets its verdict, the leaderboard SHALL refresh immediately (see `judge-result-polling`).

#### Scenario: Running contest picks up a new solve
- **WHEN** a participant's submission is accepted while another user has the leaderboard open on a running contest
- **THEN** the open leaderboard reflects the new solve within the refresh interval without a page reload

#### Scenario: Ended contest stops polling
- **WHEN** the contest `endDate` is in the past
- **THEN** the leaderboard does not refetch on an interval

#### Scenario: Own solve shows immediately
- **WHEN** the viewer's own contest submission is accepted
- **THEN** their leaderboard reflects the solve as soon as the verdict is shown, without waiting for the interval
