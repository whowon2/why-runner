# lesson-track-authoring

## Purpose

TBD
## Requirements
### Requirement: A user can create a lesson track
The owner of a class SHALL be able to create a lesson track (assignment) in that class by providing a title and an optional description. The title SHALL be required: after leading and trailing whitespace is trimmed, it SHALL be non-empty and at most 120 characters. The creator becomes the track's owner. The track's slug SHALL be derived from the provided title at creation time.

#### Scenario: Track created
- **WHEN** a class owner creates a track with a title
- **THEN** the system persists the track with that user as owner, in an unpublished state, with no lesson entries, using the given title and description

#### Scenario: Slug derived from title
- **WHEN** a class owner creates a track titled "Recursion Basics"
- **THEN** the track's slug starts with `recursion-basics-` followed by a random suffix

#### Scenario: Empty title rejected on create
- **WHEN** a class owner attempts to create a track whose title is empty or whitespace-only
- **THEN** the system SHALL reject the request and SHALL NOT persist a track

#### Scenario: Cancelling creation persists nothing
- **WHEN** a class owner opens the create-assignment dialog and closes it without confirming
- **THEN** no track is persisted

### Requirement: Only the track owner can edit or reorder it
The system SHALL restrict adding, removing, and reordering a track's lesson entries, and editing the track's title/description, to the track's owner.

#### Scenario: Owner adds a lesson entry
- **WHEN** the track's owner adds an existing problem to their track as a new lesson entry, with theme tags and optional requirements
- **THEN** the system persists a lesson entry linked to that track and that problem, positioned after the track's existing entries

#### Scenario: Owner reorders entries
- **WHEN** the track's owner moves a lesson entry up or down within their track
- **THEN** the system swaps that entry's position with its neighbour's, and the track displays entries in the new order

#### Scenario: Moving past the edge is a no-op
- **WHEN** the track's owner moves the first entry up or the last entry down
- **THEN** the order of the entries is unchanged

#### Scenario: Reorder allowed on a published track
- **WHEN** the owner of a published track moves a lesson entry
- **THEN** the system updates the order as it does for a draft

#### Scenario: Non-owner cannot edit a track
- **WHEN** a user who does not own a track attempts to add, remove, or reorder its lesson entries, or edit its title/description
- **THEN** the system SHALL reject the request

### Requirement: The same problem can back lesson entries in more than one track
The system SHALL allow a single problem to be used as the basis for lesson entries in more than one track, each with its own theme tags, requirements, and order position independent of the others.

#### Scenario: Two tracks reuse the same problem
- **WHEN** two different track owners each add the same problem as a lesson entry to their own tracks, with different requirements
- **THEN** the system persists two independent lesson entries, each scoped to its own track, and a change to one does not affect the other

### Requirement: A track must be published to appear on the roadmap
A track SHALL NOT be visible to users other than its owner until the owner publishes it. The owner SHALL be able to unpublish a previously published track.

#### Scenario: Unpublished track hidden from others
- **WHEN** a track has not been published
- **THEN** users other than the track's owner SHALL NOT see it when browsing tracks

#### Scenario: Publishing a track
- **WHEN** the track's owner publishes their track
- **THEN** the track becomes visible to all users browsing tracks

#### Scenario: Unpublishing a track
- **WHEN** the track's owner unpublishes a previously published track
- **THEN** the track is no longer visible to users other than its owner

### Requirement: Owner can edit a track's title and description
The track's owner SHALL be able to change the track's title and description at any time, whether the track is a draft or published. The same title rules as on creation SHALL apply: trimmed, non-empty, at most 120 characters. Editing the title SHALL NOT change the track's slug. After an edit, the new title SHALL appear on the track page and in the class's track list without a page reload.

#### Scenario: Owner renames a published track
- **WHEN** the owner of a published track changes its title to "Week 3 — Graphs"
- **THEN** the system persists the new title, the track keeps its existing slug and URL, and students opening the track see "Week 3 — Graphs"

#### Scenario: Owner edits description
- **WHEN** the owner changes the track's description
- **THEN** the system persists it and the track page subtitle shows the new description

#### Scenario: Empty title rejected on edit
- **WHEN** the owner submits an edit whose title is empty or whitespace-only
- **THEN** the system SHALL reject the request and the track's existing title is kept

### Requirement: Lesson entries can be removed only from draft tracks
The track's owner SHALL be able to remove a lesson entry while the track is unpublished. Removal SHALL require a confirmation step in the UI. While the track is published, the system SHALL reject removal, because removing an entry deletes students' recorded answers and feedback for it.

#### Scenario: Owner removes entry from a draft
- **WHEN** the owner of an unpublished track confirms removal of one of its lesson entries
- **THEN** the system deletes that entry and the track no longer lists it

#### Scenario: Removal rejected on a published track
- **WHEN** the owner of a published track attempts to remove a lesson entry
- **THEN** the system SHALL reject the request and the entry remains

