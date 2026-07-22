## ADDED Requirements

### Requirement: Avatar upload with crop
The system SHALL let an authenticated user replace their avatar by selecting an image file, cropping it in a circular 1:1 dialog ("Ajustar avatar"), and confirming the result as the new avatar.

#### Scenario: User selects a new avatar image
- **WHEN** the user picks an image file from the avatar upload control on the profile settings page
- **THEN** the system opens the "Ajustar avatar" crop dialog showing the image with a circular 1:1 crop frame, a grid overlay, and a zoom slider

#### Scenario: User confirms avatar crop
- **WHEN** the user adjusts pan/zoom and clicks "Confirmar" in the avatar crop dialog
- **THEN** the system uploads the cropped image, persists it as the user's avatar, replaces any previous avatar file, and the settings page immediately reflects the new avatar

#### Scenario: User cancels avatar crop
- **WHEN** the user clicks "Cancelar" in the avatar crop dialog
- **THEN** the dialog closes, no upload occurs, and the existing avatar is unchanged

### Requirement: Cover image upload with crop
The system SHALL let an authenticated user set or replace their profile cover image by selecting an image file, cropping it in a fixed wide-aspect dialog ("Ajustar capa"), and confirming the result as the new cover.

#### Scenario: User selects a new cover image
- **WHEN** the user clicks "Alterar capa" on the profile settings page and picks an image file
- **THEN** the system opens the "Ajustar capa" crop dialog showing the image with a fixed wide-aspect crop frame, a grid overlay, and a zoom slider

#### Scenario: User confirms cover crop
- **WHEN** the user adjusts pan/zoom and clicks "Confirmar" in the cover crop dialog
- **THEN** the system uploads the cropped image, persists it as the user's cover image, replaces any previous cover file, and the settings page banner immediately reflects the new cover image

#### Scenario: User cancels cover crop
- **WHEN** the user clicks "Cancelar" in the cover crop dialog
- **THEN** the dialog closes, no upload occurs, and the existing cover (or placeholder gradient, if none set) is unchanged

### Requirement: Server-side image processing and validation
The system SHALL re-process every uploaded avatar/cover image on the server before persisting it, enforcing type, size, and dimension limits.

#### Scenario: Uploaded file is re-encoded and resized
- **WHEN** a cropped image blob is received by the upload server action
- **THEN** the system validates it is an allowed image mime type, re-encodes and resizes it to the target dimensions for its kind (avatar or cover) using server-side image processing, and stores it under a server-generated filename

#### Scenario: Invalid file is rejected
- **WHEN** the uploaded blob is not a supported image type or exceeds the maximum allowed file size
- **THEN** the system rejects the upload with an error and does not modify the user's stored avatar or cover

### Requirement: Profile cover display
The system SHALL display the user's cover image as the settings page banner when one is set, and fall back to the existing gradient placeholder when none is set.

#### Scenario: User has a cover image set
- **WHEN** the profile settings page is rendered for a user with a `coverImage` value
- **THEN** the banner area displays that image instead of the gradient placeholder

#### Scenario: User has no cover image set
- **WHEN** the profile settings page is rendered for a user without a `coverImage` value
- **THEN** the banner area displays the existing gradient placeholder
