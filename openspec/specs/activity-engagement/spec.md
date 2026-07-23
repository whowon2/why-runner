## Purpose

Defines like and comment engagement on `activityFeed` items (contest/problem publish events), and requires that engagement state and controls render consistently across every surface that shows an activity item.

## Requirements

### Requirement: Like an activity feed item
The system SHALL let an authenticated user like or unlike an `activityFeed` item (contest/problem publish event), showing an accurate like count and the current user's like state.

#### Scenario: Liking an activity item
- **WHEN** an authenticated user who has not liked an activity item clicks "Like"
- **THEN** a like is recorded for that user and item, and the displayed like count increases by one

#### Scenario: Unliking an activity item
- **WHEN** an authenticated user who has already liked an activity item clicks "Like" again
- **THEN** the like is removed and the displayed like count decreases by one

#### Scenario: Duplicate like prevented
- **WHEN** a like already exists for a given user and activity item
- **THEN** the system does not create a second like row for that pair

### Requirement: Comment on an activity feed item
The system SHALL let an authenticated user add a text comment to an `activityFeed` item, and let a comment's author delete their own comment.

#### Scenario: Adding a comment
- **WHEN** an authenticated user submits non-empty comment text on an activity item
- **THEN** the comment is persisted with the author, content, and timestamp, and appears in that item's comment list

#### Scenario: Rejecting empty comment
- **WHEN** a user submits a comment with empty or whitespace-only content
- **THEN** the system rejects the submission and no comment is created

#### Scenario: Deleting own comment
- **WHEN** the author of a comment deletes it
- **THEN** the comment is removed from the activity item's comment list

#### Scenario: Cannot delete another user's comment
- **WHEN** a user who did not author a comment attempts to delete it
- **THEN** the action is rejected and the comment remains

### Requirement: Engagement visible on both feed surfaces
Like and comment counts and controls SHALL render consistently wherever an `activityFeed` item is shown: the profile "Activity Feed" tab and the `/feed` page (Following and Explore tabs).

#### Scenario: Liking from the profile Activity Feed tab reflects on /feed
- **WHEN** a user likes an activity item from their own profile's Activity Feed tab
- **THEN** that same item shows the updated like count and liked state when later viewed on the `/feed` page
