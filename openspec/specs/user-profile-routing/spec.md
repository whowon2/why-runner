# user-profile-routing

## Purpose

Defines the public, username-addressed profile route that lets any visitor view a user's profile, distinct from the self-only profile page, and the rule that owner-only editing affordances only render for the profile's owner regardless of route.

## Requirements

### Requirement: Public profile route addressed by username
The system SHALL provide a profile route addressed by a user's `username` (e.g. `/user/[username]`), rendering that user's profile to any visitor, distinct from the existing self-only profile page.

#### Scenario: Visiting another user's profile by username
- **WHEN** a user navigates to the profile route for another user's `username`
- **THEN** that user's profile (info card, tabs, etc.) renders

#### Scenario: Unknown username
- **WHEN** a user navigates to the profile route with a `username` that does not exist
- **THEN** the system SHALL treat it as not found

### Requirement: Owner-only affordances hidden for non-owner viewers
Editing controls (avatar/cover upload, profile edit form) SHALL only render when the viewer is the profile's owner, regardless of which route was used to reach the profile.

#### Scenario: Viewer is not the profile owner
- **WHEN** a signed-in user views another user's profile via the username route
- **THEN** no avatar upload, cover upload, or profile edit controls are shown

#### Scenario: Viewer is the profile owner
- **WHEN** a signed-in user views their own profile, whether via the self page or their own username route
- **THEN** avatar upload, cover upload, and profile edit controls are shown

### Requirement: Problem/contest creator names link to their profile
Anywhere a problem's or contest's creator is displayed by name (problem list, contest problem picker), that name SHALL be a link to the creator's profile at their username route.

#### Scenario: Clicking a creator's name
- **WHEN** a user clicks a problem creator's name in the problems list or the contest problem picker
- **THEN** they are navigated to that creator's profile page
