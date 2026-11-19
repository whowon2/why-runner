## ADDED Requirements

### Requirement: Age-based polling schedule for judge results
While a judge-backed row (custom run, submission, problem validation, parsons check) shown to the user is `PENDING` or `RUNNING`, the web SHALL refetch it on a schedule based on the row's age since `createdAt`: every 1 second while it is younger than 10 seconds, every 2 seconds until 1 minute, every 5 seconds until 2 minutes, and every 10 seconds until 5 minutes. When a list contains several pending rows, the youngest one SHALL set the interval. Once no shown row is pending, the query SHALL NOT poll. All judge-backed queries SHALL use this one schedule.

#### Scenario: Fresh submission is fast
- **WHEN** a student submits and the judge finishes 3 seconds later
- **THEN** the verdict is shown within about 1 second of the judge writing it

#### Scenario: Slow judge backs off
- **WHEN** a submission has been pending for 90 seconds
- **THEN** its list is refetched every 5 seconds, not every 1–2 seconds

#### Scenario: Reload keeps the schedule
- **WHEN** the student reloads the page while a 3-minute-old submission is pending
- **THEN** polling resumes at the 10-second interval, not at 1 second

### Requirement: Polling stops after five minutes pending
When the youngest pending row has been pending for 5 minutes or more, the query SHALL stop polling and the view SHALL show a "still judging" state in place of the progress state, with a **Check again** action that refetches once. If that refetch still finds the row pending, the view SHALL stay in the "still judging" state and SHALL NOT resume interval polling. A pending run SHALL keep its cancel action in this state. Because the clock is the row's `createdAt`, the stop SHALL also hold across reloads and new tabs; to tolerate client clock skew, polling SHALL also stop after 5 minutes of the page observing the row pending, and SHALL NOT stop on age alone before the page has observed the row for 30 seconds.

#### Scenario: Never-claimed run
- **WHEN** the judge never claims a run and it stays `PENDING`
- **THEN** after 5 minutes the console stops polling and shows "still judging" with Check again and Cancel

#### Scenario: Check again after the judge recovers
- **WHEN** a submission is shown as "still judging" and the judge finishes it, and the student clicks Check again
- **THEN** the verdict is shown

#### Scenario: Stale tab reopened
- **WHEN** a student opens a page whose newest submission was created an hour ago and is still `PENDING`
- **THEN** the page polls for at most 30 seconds and then shows "still judging"

### Requirement: No polling for missing rows or failed loads
A judge-result query SHALL NOT poll while it has no data or its last fetch failed. A run that cannot be found (deleted after retention, or not the user's) SHALL NOT be retried and SHALL show an error state instead of a progress state.

#### Scenario: Run deleted after retention
- **WHEN** the console holds the id of a run the judge already deleted
- **THEN** a single request fails, the console shows the run is unavailable, and no further requests are sent

### Requirement: No idle polling of submission lists
Submission lists and user contest status SHALL NOT poll while none of the shown rows is pending. New rows SHALL appear through the invalidation done by the mutation that created them.

#### Scenario: Idle exercise page
- **WHEN** a student keeps an exercise page open for 10 minutes with all submissions judged
- **THEN** no submission or contest-status requests are sent during that time

#### Scenario: New submission still appears
- **WHEN** the student then submits
- **THEN** the new pending submission appears and polling resumes on the age-based schedule

### Requirement: Verdict transition refreshes derived views
When a query observes one of the current user's submissions change from `PENDING`/`RUNNING` to a final status, the web SHALL invalidate the views derived from it: the user's contest status for that contest (solved problems), that contest's leaderboard, and the user's own submission history.

#### Scenario: Accepted contest submission
- **WHEN** a participant's contest submission is accepted while the problem page is open
- **THEN** the problem shows as solved and the leaderboard reflects the solve without waiting for its interval
