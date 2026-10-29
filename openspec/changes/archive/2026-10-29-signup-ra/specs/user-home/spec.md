## MODIFIED Requirements

### Requirement: Authenticated home route
The system SHALL serve a personal home page at `/home` (locale-prefixed like every page) to any signed-in user. Anonymous visitors SHALL be redirected to sign-in with `redirectTo=/home`.

#### Scenario: Anonymous visitor opens /home
- **WHEN** a visitor without a session requests `/home`
- **THEN** they are redirected to `/auth/signin?redirectTo=%2Fhome`

#### Scenario: Signed-in user opens /home
- **WHEN** a signed-in user requests `/home`
- **THEN** the home page renders with their widgets

### Requirement: Home is the signed-in navigation target
The dock "Home" item and the command palette "Go home" command SHALL navigate to `/home` when a session exists and to `/` otherwise. When sign-in or sign-up completes without an explicit `redirectTo`, the user SHALL land on `/home`.

#### Scenario: Signed-in user clicks dock Home
- **WHEN** a signed-in user clicks the dock Home icon
- **THEN** they navigate to `/home`

#### Scenario: Sign-in without redirectTo
- **WHEN** a user signs in from `/auth/signin` with no `redirectTo` parameter
- **THEN** they land on `/home`

#### Scenario: Sign-up without redirectTo
- **WHEN** a visitor signs up (email or social) from `/auth/signin` with no `redirectTo` parameter
- **THEN** they land on `/home`
