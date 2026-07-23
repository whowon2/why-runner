## ADDED Requirements

### Requirement: Follow and unfollow another user
The system SHALL let an authenticated user follow or unfollow another user, persisting the relationship so it can be queried in both directions (a user's followers, and who a user follows).

#### Scenario: Following a user
- **WHEN** an authenticated user who does not already follow user B triggers "Follow" on user B's profile
- **THEN** a follow relationship (current user → B) is created and B appears in the current user's following list

#### Scenario: Unfollowing a user
- **WHEN** an authenticated user who already follows user B triggers "Unfollow" on user B's profile
- **THEN** the follow relationship (current user → B) is removed

#### Scenario: Idempotent follow state
- **WHEN** a user who already follows user B triggers "Follow" again (e.g. duplicate click)
- **THEN** the system does not create a duplicate relationship and the state remains "following"

### Requirement: Self-follow is rejected
The system SHALL reject a user's attempt to follow themselves.

#### Scenario: Attempting to follow own profile
- **WHEN** an authenticated user triggers "Follow" while viewing their own profile
- **THEN** the action is rejected and no follow relationship is created

### Requirement: Profile shows follow state and counts
A user profile page SHALL show follower and following counts, and, when viewed by an authenticated user other than the profile owner, whether the viewer currently follows the profile owner.

#### Scenario: Viewing another user's profile while following them
- **WHEN** an authenticated user who follows the profile owner views that profile
- **THEN** the profile shows a "Following" state control (not "Follow") and accurate follower/following counts

#### Scenario: Viewing own profile
- **WHEN** an authenticated user views their own profile
- **THEN** the profile shows follower/following counts but no follow/unfollow control for themselves

### Requirement: Dedicated followers/following list pages
The system SHALL provide `/user/[username]/followers` and `/user/[username]/following` pages listing the relevant users, infinite-scroll, each row showing avatar, name, username, and a follow/unfollow control for the viewer (mirroring davar's `FollowList` pattern), and the profile's follower/following counts SHALL link to these pages. Each page SHALL include a search bar that filters the list by name or username.

#### Scenario: Viewing a user's followers list
- **WHEN** an authenticated user navigates to `/user/[username]/followers`
- **THEN** a paginated list of users following that profile is shown, newest-follow first

#### Scenario: Viewing a user's following list
- **WHEN** an authenticated user navigates to `/user/[username]/following`
- **THEN** a paginated list of users that profile follows is shown, newest-follow first

#### Scenario: Authenticated viewer can follow from the list
- **WHEN** an authenticated viewer sees another user's row on either list
- **THEN** a follow/unfollow control reflecting current state is shown next to that row

#### Scenario: Filtering a followers/following list by search
- **WHEN** an authenticated user types text into the search bar on either list page
- **THEN** the list narrows to users whose name or username matches the query (debounced, no full page reload)
