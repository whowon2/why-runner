## ADDED Requirements

### Requirement: User has a unique username and onboarding status
Every user SHALL have a `username` (unique, distinct from their display `name`) and a `finishedOnboarding` flag, defaulting to `false` for newly created users.

#### Scenario: New user starts without finished onboarding
- **WHEN** a new user account is created (e.g. via sign-up)
- **THEN** the user's `finishedOnboarding` is `false`

### Requirement: Onboarding gate redirects until finished
An authenticated user whose `finishedOnboarding` is `false` SHALL be redirected to the onboarding page when navigating to any other page, until they complete onboarding.

#### Scenario: Unonboarded user navigates to the app
- **WHEN** an authenticated user with `finishedOnboarding = false` requests any page other than the onboarding page
- **THEN** they are redirected to the onboarding page

#### Scenario: Onboarded user is not redirected
- **WHEN** an authenticated user with `finishedOnboarding = true` requests any page
- **THEN** no onboarding redirect occurs

### Requirement: Onboarding page collects a username
The onboarding page SHALL let the user set their `username`. Submitting a valid, unused username SHALL persist it and set `finishedOnboarding` to `true`.

#### Scenario: Completing onboarding
- **WHEN** a user on the onboarding page submits an available username
- **THEN** the user's `username` is set to that value, `finishedOnboarding` becomes `true`, and they are no longer redirected to onboarding

#### Scenario: Username already taken
- **WHEN** a user submits a username that another user already has
- **THEN** the submission is rejected with an error and `finishedOnboarding` remains `false`
