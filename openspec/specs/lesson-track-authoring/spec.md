# lesson-track-authoring

## Purpose

TBD

## Requirements

### Requirement: A user can create a lesson track
Any authenticated user SHALL be able to create a lesson track with a title and optional description. The creator becomes the track's owner.

#### Scenario: Track created
- **WHEN** a user creates a track with a title
- **THEN** the system persists the track with that user as owner, in an unpublished state, with no lesson entries

### Requirement: Only the track owner can edit or reorder it
The system SHALL restrict adding, removing, and reordering a track's lesson entries, and editing the track's title/description, to the track's owner.

#### Scenario: Owner adds a lesson entry
- **WHEN** the track's owner adds an existing problem to their track as a new lesson entry, with theme tags and optional requirements
- **THEN** the system persists a lesson entry linked to that track and that problem, positioned after the track's existing entries

#### Scenario: Owner reorders entries
- **WHEN** the track's owner changes the order position of a lesson entry within their track
- **THEN** the system updates that entry's position and the track displays entries in the new order

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
