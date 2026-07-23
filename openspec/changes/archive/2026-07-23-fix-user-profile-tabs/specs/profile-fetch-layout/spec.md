## ADDED Requirements

### Requirement: Profile tabs are Posts, Contests, Problems
Below the info card, the profile page SHALL render exactly three tabs labeled "Posts", "Contests", and "Problems", each scoped to the profile's user (not the currently signed-in viewer).

#### Scenario: Tab labels
- **WHEN** a user opens any profile page
- **THEN** the tab bar shows exactly three tabs labeled "Posts", "Contests", and "Problems", in that order

#### Scenario: Tabs scoped to profile user
- **WHEN** a signed-in user views another user's profile
- **THEN** the Posts, Contests, and Problems tabs each show only that profile's user's posts, contests, and problems, never the viewer's own

### Requirement: Posts tab renders as a scoped section, not a duplicate feed page
The Posts tab SHALL render the profile user's posts as a self-contained list scoped to the profile, without duplicating the standalone feed page's own page-level title, subtitle, or "caught up" footer chrome.

#### Scenario: Posts tab content
- **WHEN** a user opens the Posts tab on a profile
- **THEN** the list of that user's posts renders without a page-level title/subtitle header or a "caught up" footer duplicated from the site-wide feed page

### Requirement: Contests and Problems tabs match their list-page presentation
The Contests tab SHALL present the profile user's contests using the same card presentation as the `/contests` list page, and the Problems tab SHALL present the profile user's problems using the same table presentation as the `/problems` list page, including pagination when the result set exceeds one page.

#### Scenario: Contests tab presentation
- **WHEN** a user opens the Contests tab on a profile
- **THEN** the profile user's contests render as cards in the same visual style as the `/contests` list page, paginated if there are more than fit on one page

#### Scenario: Problems tab presentation
- **WHEN** a user opens the Problems tab on a profile
- **THEN** the profile user's problems render as a table in the same visual style as the `/problems` list page, paginated if there are more than fit on one page

### Requirement: Empty states use shadcn Empty with owner/visitor-specific copy
Each of the three tabs SHALL use the shadcn `Empty` component to render its empty state, with title/description copy that differs depending on whether the viewer is the profile's owner or a visitor.

#### Scenario: Owner viewing their own empty tab
- **WHEN** the profile's owner opens a tab (Posts, Contests, or Problems) that has no items
- **THEN** the `Empty` component renders copy addressed to the owner (e.g. inviting them to create one), and an owner-only create action where applicable

#### Scenario: Visitor viewing another user's empty tab
- **WHEN** a visitor who is not the profile's owner opens a tab that has no items
- **THEN** the `Empty` component renders copy stating that user has no items yet, without any create action
