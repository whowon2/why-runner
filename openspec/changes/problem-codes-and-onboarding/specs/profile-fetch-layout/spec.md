## MODIFIED Requirements

### Requirement: Avatar upload affordance preserved in the new layout
The left-column avatar block SHALL retain a click-to-upload interaction for changing the avatar image, including the crop dialog, when the viewer is the profile's owner. The control SHALL be icon-only (no solid background box) so it reads cleanly over the avatar photo. When the viewer is not the profile's owner, no upload affordance SHALL be rendered.

#### Scenario: Changing avatar from the new layout
- **WHEN** the profile owner clicks the avatar in the left column of the fetch-style layout
- **THEN** the same file picker and crop dialog used previously opens, and confirming the crop uploads the new avatar

#### Scenario: Non-owner views the avatar
- **WHEN** a user who is not the profile's owner views the avatar in the left column
- **THEN** no upload affordance is rendered on or near the avatar

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
