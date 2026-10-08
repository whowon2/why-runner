## ADDED Requirements

### Requirement: Language switcher available to every visitor
The system SHALL render a language switcher in the dock for every visitor, whether or not they have an active session. The switcher MUST offer every locale in `routing.locales` (Portuguese `br`, English `en`) and MUST indicate the currently active locale.

#### Scenario: Signed-out visitor sees the switcher
- **WHEN** a visitor without a session opens any page that renders the dock (including `/auth/signin`)
- **THEN** the dock shows the language switcher alongside the login button

#### Scenario: Signed-in user sees the switcher
- **WHEN** a signed-in user opens any page that renders the dock
- **THEN** the dock shows the language switcher

#### Scenario: Active locale is marked
- **WHEN** a visitor opens the language switcher while viewing the site in English
- **THEN** the English option is marked as selected and the Portuguese option is not

### Requirement: Switching language preserves the current page
Selecting a language SHALL navigate to the same pathname and search params under the chosen locale prefix, without requiring sign-in and without a full page reload.

#### Scenario: Guest switches language on the sign-in page
- **WHEN** a signed-out visitor on `/en/auth/signin?redirect=/en/problems` selects Portuguese
- **THEN** the browser lands on `/br/auth/signin?redirect=/en/problems` with the UI rendered in Portuguese

#### Scenario: Selecting the current locale is a no-op
- **WHEN** a visitor selects the locale that is already active
- **THEN** the page and URL stay unchanged

### Requirement: Language choice persists across visits
The chosen locale SHALL be remembered for subsequent visits to unprefixed URLs, for signed-in and signed-out visitors alike.

#### Scenario: Returning guest keeps chosen language
- **WHEN** a signed-out visitor switches to Portuguese and later opens `/` in the same browser
- **THEN** they are redirected to the Portuguese (`/br`) version of the site

### Requirement: Single language control
The language switcher in the dock SHALL be the only language control in the UI chrome; the avatar dropdown MUST NOT contain a separate language submenu.

#### Scenario: Avatar menu has no language submenu
- **WHEN** a signed-in user opens the avatar dropdown
- **THEN** it shows profile and logout entries but no language submenu
