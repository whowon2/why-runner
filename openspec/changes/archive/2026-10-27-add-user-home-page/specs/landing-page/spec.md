## ADDED Requirements

### Requirement: Single auth-aware hero call to action
The landing page hero SHALL NOT link to the contests or problems lists. It SHALL show exactly one primary call to action: "Get started" linking to `/auth/signin` for visitors without a session, and "Go to home" linking to `/home` for signed-in users. The landing page itself SHALL remain publicly reachable at `/` for both.

#### Scenario: Anonymous visitor
- **WHEN** a visitor without a session opens `/`
- **THEN** the hero shows a "Get started" button linking to sign-in and no Contests/Problems buttons

#### Scenario: Signed-in visitor
- **WHEN** a signed-in user opens `/`
- **THEN** the landing page renders (no redirect) and the hero button reads "Go to home" and links to `/home`
