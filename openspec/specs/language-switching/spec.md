# language-switching Specification

## Purpose
TBD - created by archiving change allow-guest-language-switch. Update Purpose after archive.
## Requirements
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

### Requirement: Portuguese is the default locale
The routing configuration SHALL use Portuguese (`br`) as the default locale. When a visitor opens an unprefixed URL with no stored language choice, the locale SHALL be detected from `Accept-Language`, where any `pt` tag (`pt`, `pt-BR`, `pt-PT`, any case) SHALL count as `br`. A visitor whose `Accept-Language` matches neither supported locale SHALL get `br`. A stored choice (the locale cookie) or an explicit `/en` / `/br` prefix SHALL take precedence over detection.

#### Scenario: Brazilian browser that also lists English
- **WHEN** a first-time visitor opens `/` with `Accept-Language: pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7`
- **THEN** they are redirected to `/br` and the UI renders in Portuguese

#### Scenario: Browser with an unsupported language
- **WHEN** a first-time visitor opens `/` with `Accept-Language: es-ES,es;q=0.9`
- **THEN** they are redirected to `/br`

#### Scenario: English browser
- **WHEN** a first-time visitor opens `/` with `Accept-Language: en-US,en;q=0.9`
- **THEN** they are redirected to `/en`

#### Scenario: Stored choice wins over detection
- **WHEN** a visitor who previously switched to English opens `/` with `Accept-Language: pt-BR`
- **THEN** they are redirected to `/en`

