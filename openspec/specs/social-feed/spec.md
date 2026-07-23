## Purpose

Defines the `/feed` page: a Following/Explore view of `activityFeed` items with infinite scroll, and the ability to follow authors discovered while browsing Explore.

## Requirements

### Requirement: Feed page with Following and Explore tabs
The system SHALL provide an authenticated `/feed` page with two tabs, "Following" and "Explore", each showing `activityFeed` items (contest/problem publish events) newest-first with infinite scroll (cursor pagination).

#### Scenario: Viewing Following tab
- **WHEN** an authenticated user opens `/feed` on the "Following" tab
- **THEN** the system returns activity items authored only by users the current user follows, newest first

#### Scenario: Viewing Explore tab
- **WHEN** an authenticated user opens `/feed` on the "Explore" tab
- **THEN** the system returns activity items from all users (including users not followed), newest first

#### Scenario: Following tab with no follows
- **WHEN** a user who follows no one opens the "Following" tab
- **THEN** the system shows an empty state that guides the user to the "Explore" tab to find people to follow

#### Scenario: Infinite scroll pagination
- **WHEN** a user scrolls to the end of the currently loaded feed items and more items exist
- **THEN** the system loads the next page using a cursor and appends it without duplicating already-shown items

#### Scenario: Unauthenticated access
- **WHEN** an unauthenticated visitor requests `/feed`
- **THEN** the system redirects to sign-in

### Requirement: Explore surfaces followable users
The Explore tab SHALL display, for each activity item, the author's identity and a follow/unfollow control so the user can follow people discovered through Explore without leaving the feed.

#### Scenario: Following a user from Explore
- **WHEN** a user clicks "Follow" on an Explore feed item authored by a user they don't yet follow
- **THEN** the follow relationship is created and the item's control switches to "Following", and the followed user's future activity begins appearing in the current user's Following tab
