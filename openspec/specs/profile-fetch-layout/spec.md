# profile-fetch-layout

## Purpose

Defines the fastfetch/onefetch-inspired two-column info-card layout for the user profile page: a left-column avatar/logo block, an ordered `label: value` fact-row list, and a decorative color-swatch footer. Also defines how the user's cover image renders (as a dimmed full-bleed card background rather than a banner) and how text stays legible over it regardless of the photo's brightness.

## Requirements

### Requirement: Two-column fetch-style info card
The profile page SHALL render the user's info card as a two-column layout: a fixed-width avatar/logo block on the left, and an ordered list of `label: value` fact rows on the right, mirroring the layout produced by terminal system-info tools (fastfetch, onefetch) rather than a banner-and-stat-card social layout.

#### Scenario: Viewing a profile on desktop width
- **WHEN** a user views their profile on a viewport at or above the `sm` breakpoint
- **THEN** the avatar block renders to the left of the fact-row list, side by side

#### Scenario: Viewing a profile on mobile width
- **WHEN** a user views their profile below the `sm` breakpoint
- **THEN** the avatar block stacks above the fact-row list in a single column

### Requirement: Header line identifies the user
The fact-row list SHALL begin with a header line displaying the user's display name, styled as the prominent first line of the block (matching fastfetch/onefetch's `user@host` header row), followed by a horizontal separator before the fact rows.

#### Scenario: Header renders user name
- **WHEN** the profile data has loaded for a user named "ada"
- **THEN** the header line displays "ada" as the first line of the info block, visually distinct from the rows below it

### Requirement: Fact rows cover identity and skills
The fact-row list SHALL include, in order, whichever of the following are available for the user: bio, location, website, joined date, contest count, problem count, theme skills, and language skills — each as a single `label: value` row. There is no global-rank row.

#### Scenario: All fields present
- **WHEN** a user has a bio, location, website, join date, contest count, problem count, and at least one theme skill and one language skill
- **THEN** each of these appears as its own labeled row in the stated order

#### Scenario: Optional field absent
- **WHEN** a user has no `location` set
- **THEN** no location row is rendered, and no gap is left in its place

#### Scenario: Skills row packs multiple values
- **WHEN** a user has more than one theme skill
- **THEN** the theme skills row displays all of that user's theme skill values together on the same labeled row, wrapping onto additional lines only if they do not fit

### Requirement: Avatar upload affordance preserved in the new layout
The left-column avatar block SHALL retain a click-to-upload interaction for changing the avatar image, including the crop dialog, when the viewer is the profile's owner. The control SHALL be icon-only (no solid background box) so it reads cleanly over the avatar photo. When the viewer is not the profile's owner, no upload affordance SHALL be rendered.

#### Scenario: Changing avatar from the new layout
- **WHEN** the profile owner clicks the avatar in the left column of the fetch-style layout
- **THEN** the same file picker and crop dialog used previously opens, and confirming the crop uploads the new avatar

#### Scenario: Non-owner views the avatar
- **WHEN** a user who is not the profile's owner views the avatar in the left column
- **THEN** no upload affordance is rendered on or near the avatar

### Requirement: Decorative color-swatch footer
The info card SHALL render a footer row of solid color swatches below the fact-row list, purely decorative and not bound to any user data, matching the color-palette strip printed by fastfetch and onefetch.

#### Scenario: Footer renders regardless of user data
- **WHEN** the profile info card is displayed for any user, regardless of how many fields they have filled in
- **THEN** the color-swatch footer row is present and identical in content

### Requirement: Cover image renders as a dimmed card background
When a user has a cover image set, the profile info card SHALL render that image as a full-bleed background behind the entire card content, dimmed by a per-user, user-configurable darkness amount, rather than as a separate full-width banner strip above the card.

#### Scenario: Cover image present
- **WHEN** a user has a `coverImage` set
- **THEN** that image fills the card as its background, with a black overlay whose opacity equals the user's stored dim value (0-100)

#### Scenario: No cover image set
- **WHEN** a user has no `coverImage` set
- **THEN** the card falls back to the theme's normal card background with no image layer

### Requirement: Cover image upload with dim control preserved on the card
When the viewer is the profile's owner, the card SHALL provide an icon-only camera button at its bottom-left corner to upload or change the cover image, opening the same crop dialog flow as the avatar, and that dialog SHALL include a slider to set the dim amount (0-100) applied to the cover background, seeded from the user's current dim value. When the viewer is not the owner, no camera button SHALL be rendered.

#### Scenario: Changing cover from the profile card
- **WHEN** the profile owner clicks the camera button at the bottom-left of the profile card
- **THEN** a file picker and crop dialog open with a dim-amount slider, and confirming uploads the new cover image and saves the chosen dim value

#### Scenario: Dim value persists per user
- **WHEN** a user sets the dim slider to a value and confirms the cover upload
- **THEN** that dim value is stored for the user and used the next time their profile card renders that cover image

#### Scenario: Non-owner views the cover
- **WHEN** a user who is not the profile's owner views a profile with a cover image
- **THEN** no camera button is rendered on the card

### Requirement: Text remains legible over any cover image
Fact-row text, the header, and skill badges SHALL remain legible regardless of the cover image's brightness or the chosen dim value, without relying on a solid background panel that would obscure the photo.

#### Scenario: Bright cover image
- **WHEN** a user's cover image is mostly white or light-colored, even with a low dim value
- **THEN** the header, fact-row text, and skill badges remain readable via a dark shadow/outline effect on the text rather than a solid backdrop panel

#### Scenario: Cover image absent
- **WHEN** a user has no cover image set
- **THEN** fact-row text uses the normal theme foreground colors, matching the current light/dark theme
