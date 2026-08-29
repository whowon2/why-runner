## MODIFIED Requirements

### Requirement: Profile tabs are Posts, Contests, Problems
Below the info card, the profile page SHALL render exactly two tabs labeled "Contests" and "Problems", each scoped to the profile's user (not the currently signed-in viewer).

#### Scenario: Tab labels
- **WHEN** a user opens any profile page
- **THEN** the tab bar shows exactly two tabs labeled "Contests" and "Problems", in that order

#### Scenario: Tabs scoped to profile user
- **WHEN** a signed-in user views another user's profile
- **THEN** the Contests and Problems tabs each show only that profile's user's contests and problems, never the viewer's own

### Requirement: Fact rows cover identity and skills
The fact-row list SHALL include, in order, whichever of the following are available for the user: bio, location, website, joined date, contest count, problem count, theme skills, and language skills — each as a single `label: value` row. There is no global-rank row, and no follower/following count row.

#### Scenario: All fields present
- **WHEN** a user has a bio, location, website, join date, contest count, problem count, and at least one theme skill and one language skill
- **THEN** each of these appears as its own labeled row in the stated order

#### Scenario: Optional field absent
- **WHEN** a user has no `location` set
- **THEN** no location row is rendered, and no gap is left in its place

#### Scenario: Skills row packs multiple values
- **WHEN** a user has more than one theme skill
- **THEN** the theme skills row displays all of that user's theme skill values together on the same labeled row, wrapping onto additional lines only if they do not fit

## REMOVED Requirements

### Requirement: Posts tab renders as a scoped section, not a duplicate feed page
**Reason**: The "Posts" tab (backed by `activityFeed`) is removed along with the rest of the social feed as part of WhyRunner's pivot to an educational platform.
**Migration**: None. The profile now has two tabs (Contests, Problems); there is no Posts tab to render.
