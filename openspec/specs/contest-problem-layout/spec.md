## Purpose

Defines the layout of a contest's Problems tab: a wide, viewport-height statement/editor workspace with a resizable split on large screens and a stacked layout on narrow screens, so contestants get usable editor space for the whole contest.
## Requirements
### Requirement: Contest problems open in their own fullscreen route
Each contest problem SHALL be reachable at `/contests/[slug]/problems/[problemSlug]`, rendered in the workspace shell, subject to the same access rules as the previous Problems tab: the contest must have started (owners excepted, with a live countdown until start), pending joiners see a pending notice, and non-participants may view problems of a running contest only after it ends. The contest page's Problems tab SHALL list the contest's problems (letter, title, solved marking) linking to that route. A URL `/contests/[slug]?tab=problems&problem=<problemSlug>` SHALL redirect to the new route.

#### Scenario: Open from list
- **WHEN** a participant clicks problem B on the contest's Problems tab
- **THEN** the browser goes to `/contests/<slug>/problems/<problem-B-slug>` showing the fullscreen workspace

#### Scenario: Old link
- **WHEN** a user opens `/contests/<slug>?tab=problems&problem=<x>`
- **THEN** they are redirected to `/contests/<slug>/problems/<x>`

#### Scenario: Not started
- **WHEN** a participant opens a contest problem URL before the contest starts
- **THEN** the page shows the not-started notice and opens the problem once the start time passes, without reload

### Requirement: Contest workspace context
In a contest problem workspace the rail SHALL show the contest's problem letters (solved ones marked, the current one highlighted) and a Leaderboard drawer; the top bar SHALL show the letter + title, the time remaining and the participant's solved count; the history drawer SHALL list only the participant's submissions to this problem in this contest; AI help SHALL follow the contest's `aiAssistance` setting.

#### Scenario: Leaderboard drawer
- **WHEN** a participant clicks Leaderboard in the rail
- **THEN** the contest leaderboard opens in a drawer and the editor keeps its code

#### Scenario: Solved letter updates
- **WHEN** a participant's submission to problem A passes
- **THEN** letter A in the rail becomes marked as solved without reload

