## MODIFIED Requirements

### Requirement: Comment on an activity feed item
The system SHALL let an authenticated user add a text comment to an `activityFeed` item, reply to an existing top-level comment, and let a comment's author delete their own comment (via a visible delete control). Comment nesting is limited to one level: a reply cannot itself be replied to.

#### Scenario: Adding a comment
- **WHEN** an authenticated user submits non-empty comment text on an activity item
- **THEN** the comment is persisted with the author, content, and timestamp, and appears as a top-level comment in that item's comment list

#### Scenario: Rejecting empty comment
- **WHEN** a user submits a comment with empty or whitespace-only content
- **THEN** the system rejects the submission and no comment is created

#### Scenario: Replying to a top-level comment
- **WHEN** an authenticated user submits non-empty text via the "Reply" control on a top-level comment
- **THEN** the reply is persisted with a reference to the parent comment and rendered nested under it

#### Scenario: Rejecting a reply to a reply
- **WHEN** a user attempts to reply to a comment that is itself a reply (has a parent)
- **THEN** the system rejects the submission and no comment is created

#### Scenario: Deleting own comment
- **WHEN** the author of a comment clicks the delete control on their own comment
- **THEN** the comment is removed from the activity item's comment list; if it was a top-level comment, its replies are removed along with it

#### Scenario: Cannot delete another user's comment
- **WHEN** a user who did not author a comment attempts to delete it
- **THEN** the action is rejected and the comment remains

#### Scenario: Comment delete control only shown to author
- **WHEN** a user views a comment they did not author
- **THEN** no delete control is rendered for that comment

## ADDED Requirements

### Requirement: Delete own activity item
The system SHALL let the author of an `activityFeed` item delete it via a menu on the item, removing the item and its likes and comments.

#### Scenario: Deleting own activity item
- **WHEN** the author of an activity item selects "Delete" from that item's menu
- **THEN** the activity item, along with its likes and comments, is removed and no longer appears on any feed surface

#### Scenario: Cannot delete another user's activity item
- **WHEN** a user who did not author an activity item attempts to delete it
- **THEN** the action is rejected and the activity item remains

#### Scenario: Delete menu only shown to author
- **WHEN** a user views an activity item they did not author
- **THEN** no delete menu is rendered for that item
