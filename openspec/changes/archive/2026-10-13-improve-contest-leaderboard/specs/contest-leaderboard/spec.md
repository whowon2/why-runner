## ADDED Requirements

### Requirement: Standings are derived from contest submissions
The leaderboard SHALL compute each accepted participant's results from the `submission` rows of that contest (`submission.contestId` = contest id), matched to contest problems by `problemId`. Only submissions created at or after the contest `startDate` (when set) and at or before the contest `endDate` (when set) SHALL count. For each participant and problem, the system SHALL determine:
- **solved**: whether any counting submission has status `PASSED`;
- **solve time**: whole minutes from `startDate` to the earliest `PASSED` submission (0 when `startDate` is unset);
- **rejected attempts**: the number of counting submissions with status `FAILED` or `CONSTRAINT_VIOLATION` created before the earliest `PASSED` one (or all of them, if unsolved);
- **pending**: whether any counting submission has status `PENDING`, `RUNNING`, or `PENDING_CONSTRAINT_CLASSIFICATION` and the problem is not yet solved.

Submissions with status `ERROR` SHALL NOT count as rejected attempts.

#### Scenario: Solved after two wrong attempts
- **WHEN** a participant submits problem B with results FAILED, FAILED, PASSED (in that order) during the contest
- **THEN** problem B is solved for them with 2 rejected attempts and a solve time equal to the minutes between contest start and the PASSED submission

#### Scenario: Constraint violation counts as a rejection, not a solve
- **WHEN** a participant's only submission for a problem ends with status `CONSTRAINT_VIOLATION`
- **THEN** the problem is not solved for them and shows 1 rejected attempt

#### Scenario: Judge error is not penalised
- **WHEN** a participant's submission for a problem ends with status `ERROR`
- **THEN** it does not add a rejected attempt

#### Scenario: Submission after the contest ends
- **WHEN** a participant gets `PASSED` on a problem with a submission created after the contest `endDate`
- **THEN** the leaderboard does not count that problem as solved

#### Scenario: Submission still being judged
- **WHEN** a participant's latest submission for an unsolved problem has status `PENDING`
- **THEN** that problem is marked pending for them

### Requirement: Ranking by solved count then penalty
Participants SHALL be ordered by number of solved problems (descending), then by total penalty (ascending), where total penalty is the sum, over solved problems only, of solve time plus 20 minutes per rejected attempt on that problem. Participants with equal solved count and equal total penalty SHALL share the same rank, and the next distinct position SHALL skip accordingly (standard competition ranking, e.g. 1, 2, 2, 4). Within a tie, rows SHALL be ordered by name for stable display. Every accepted participant SHALL appear, including those with no submissions.

#### Scenario: Same solved count, lower penalty wins
- **WHEN** Alice and Bob each solved 2 problems, Alice with total penalty 45 and Bob with 70
- **THEN** Alice is ranked above Bob

#### Scenario: Unsolved attempts do not add penalty
- **WHEN** a participant has 3 rejected attempts on a problem they never solve
- **THEN** their total penalty is unaffected by that problem

#### Scenario: Exact tie shares rank
- **WHEN** two participants have the same solved count and the same total penalty, and are the top two
- **THEN** both are shown with rank 1 and the next participant is shown with rank 3

#### Scenario: Participant with no submissions
- **WHEN** an accepted participant has made no submissions
- **THEN** they appear at the bottom group with 0 solved and 0 penalty

### Requirement: Per-problem cell content
For each participant and each contest problem (columns in contest problem order, labelled by letter), the leaderboard SHALL show one of:
- **solved**: a solved indicator, the total number of attempts (rejected attempts plus the accepted one), and the solve time in minutes;
- **attempted**: an unsolved indicator with the total number of rejected attempts;
- **pending**: a pending indicator, alongside the attempt count so far when non-zero;
- **untouched**: a neutral placeholder (e.g. "–").

Every cell with at least one counted attempt SHALL display its attempt count; attempt counts SHALL NOT be hidden behind hover-only UI.

For each problem, the participant(s) with the earliest `PASSED` submission SHALL have their cell marked as the first solve of that problem. Each row SHALL also show the solved count and total penalty.

#### Scenario: Solved cell
- **WHEN** a participant solved problem A at minute 34 after 1 rejected attempt
- **THEN** their A cell shows it as solved with 2 attempts and "34" minutes

#### Scenario: Attempted-only cell
- **WHEN** a participant has 3 rejected attempts on problem D and no PASSED
- **THEN** their D cell shows it as unsolved with 3 attempts

#### Scenario: First solve marker
- **WHEN** Carol's PASSED submission for problem C is earlier than every other participant's
- **THEN** Carol's C cell carries the first-solve marker and no other C cell does

### Requirement: Leaderboard visibility and exposed data
The leaderboard SHALL apply the same visibility rules as the contest page: a draft contest's leaderboard SHALL be available only to its creator, and a private contest's leaderboard only to its creator and accepted participants. When unavailable, the server SHALL return no standings. The standings payload SHALL expose for each participant only their user id, display name, username, and avatar image — never email or other private user fields.

#### Scenario: Non-member requests private contest leaderboard
- **WHEN** a signed-in user who is neither the creator nor an accepted participant requests the leaderboard of a private contest
- **THEN** no standings are returned

#### Scenario: Payload excludes email
- **WHEN** any viewer loads a leaderboard they may see
- **THEN** no participant email address is included in the response

### Requirement: Live refresh while running
While the contest is running (started and not yet ended), the leaderboard SHALL refresh its standings automatically at a fixed interval of at most 15 seconds. Once the contest has ended, or before it has started, it SHALL NOT poll.

#### Scenario: Running contest picks up a new solve
- **WHEN** a participant's submission is accepted while another user has the leaderboard open on a running contest
- **THEN** the open leaderboard reflects the new solve within the refresh interval without a page reload

#### Scenario: Ended contest stops polling
- **WHEN** the contest `endDate` is in the past
- **THEN** the leaderboard does not refetch on an interval

### Requirement: Viewer's own row is highlighted
When the viewer is an accepted participant, their row SHALL be visually highlighted. If their row is scrolled out of view within the leaderboard, a copy of it SHALL remain visible pinned to the edge of the leaderboard.

#### Scenario: Participant sees own row
- **WHEN** an accepted participant opens the leaderboard
- **THEN** their row is highlighted

#### Scenario: Owner without a row
- **WHEN** the contest creator, who is not a participant, opens the leaderboard
- **THEN** no row is highlighted and no pinned row is shown

### Requirement: Uniform column layout
The leaderboard table SHALL use a fixed layout in which every problem column has the same width regardless of cell content or header letter. The participant column SHALL take the remaining width, and names that do not fit SHALL be truncated with the full name available on hover. The Solved and Penalty columns SHALL have fixed widths and be right-aligned. On viewports too narrow for all columns, the table SHALL scroll horizontally while the rank and participant columns stay visible.

#### Scenario: Solved column not wider than empty ones
- **WHEN** a contest has problems A–J and only A has any solve
- **THEN** columns A through J render with identical widths

#### Scenario: Long participant name
- **WHEN** a participant's name is longer than the participant column
- **THEN** it is truncated with an ellipsis and the full name is shown on hover, without widening the column

### Requirement: Contest export bundle
The contest owner's export SHALL download a single ZIP archive containing:
- `standings.csv`: one row per accepted participant in leaderboard order, with rank, name, username, email, solved count, total penalty, one column per problem letter (attempt count and solve minute, or attempt count only when unsolved, blank when untouched), total submissions, and pass rate. Values SHALL come from the same standings computation as the leaderboard.
- `submissions.csv`: one row per submission made to the contest, ordered by creation time, with participant name, username, email, problem letter, problem title, language, status, constraint-violation detail, creation timestamp (ISO 8601), minutes from contest start, whether it counted toward standings, runtime (ms), memory (KB), code size, judge output, and the path of its code file within the archive.
- `code/<username>/<letter>-<sequence>-<status>.<ext>`: the submitted source of every submission, with a file extension matching its language, where `<sequence>` is the submission's 1-based order among that participant's submissions to that problem.

All CSV fields SHALL be escaped per RFC 4180 (fields quoted, embedded quotes doubled) so names, outputs, or details containing commas, quotes, or newlines stay in one field. Only the contest creator SHALL be able to export.

#### Scenario: Archive contents
- **WHEN** the owner exports a contest where Alice submitted problem A twice in Python
- **THEN** the ZIP contains `standings.csv`, `submissions.csv` with two rows for Alice/A, and `code/<alice-username>/A-1-<status>.py` and `code/<alice-username>/A-2-<status>.py`

#### Scenario: Export order equals on-screen order
- **WHEN** the owner exports a contest whose leaderboard shows Alice (rank 1) and Bob (rank 2)
- **THEN** `standings.csv` lists Alice before Bob with ranks 1 and 2 and the same solved and penalty values

#### Scenario: Special characters in fields
- **WHEN** a participant's name contains a comma and a double quote
- **THEN** each CSV still parses with that name as a single field with the quote preserved

#### Scenario: Late submission is exported but flagged
- **WHEN** a participant submitted after the contest `endDate`
- **THEN** the submission appears in `submissions.csv` with its counted flag false and is absent from `standings.csv` totals

#### Scenario: Non-owner cannot export
- **WHEN** a user other than the contest creator invokes the export
- **THEN** the export is refused and no data is returned
