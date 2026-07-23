## Purpose

Defines the global site footer's content: legal page navigation and the GitHub repository link, including the corresponding removal of the GitHub link from the floating user dock.

## Requirements

### Requirement: Footer displays legal navigation links
The global footer SHALL display links to all six legal pages (label translated per locale: Terms of Use, Privacy, Cookies, Community Guidelines, Copyright, Moderation), each navigating to that page's URL slug — one fixed English slug shared across every locale, consistent with every other route in the app.

#### Scenario: Footer legal links navigate correctly
- **WHEN** a user on the `br` locale clicks "Termos de Uso" in the footer
- **THEN** the browser navigates to `/br/terms` (Portuguese label, English slug)

#### Scenario: Footer legal link slug is identical across locales
- **WHEN** comparing the "Terms of Use" footer link's target on `en` vs `br`
- **THEN** both point to the `/terms` slug (`/en/terms` and `/br/terms` respectively) — only the locale prefix and link label differ, not the slug

#### Scenario: All six legal links are present
- **WHEN** the footer renders on any page
- **THEN** all six legal page links are visible in the footer's legal navigation area

### Requirement: Footer displays the GitHub repository link
The global footer SHALL display a link to the project's GitHub repository (`https://github.com/whowon2/why-runner`), opening in a new tab.

#### Scenario: GitHub link opens repository in new tab
- **WHEN** a user clicks the GitHub icon in the footer
- **THEN** a new browser tab opens to `https://github.com/whowon2/why-runner`

### Requirement: User dock no longer displays the GitHub link
The floating user dock SHALL NOT display a GitHub repository icon or link; that link is exclusively presented in the footer.

#### Scenario: Dock renders without GitHub icon
- **WHEN** the user dock renders on any page
- **THEN** no GitHub icon or link is present among the dock's icons
</content>
