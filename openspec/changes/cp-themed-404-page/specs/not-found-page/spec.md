## ADDED Requirements

### Requirement: Themed 404 presentation
The system SHALL render the route-not-found page (`web/app/[locale]/not-found.tsx`) using a competitive-programming/judge-verdict visual motif instead of a generic empty-state message, so the page is recognizable as part of WhyRunner rather than default framework boilerplate.

#### Scenario: User navigates to a nonexistent route
- **WHEN** a user requests a URL that does not match any route (triggering Next.js's not-found boundary)
- **THEN** the page displays a judge/terminal-styled panel containing a mock error/verdict (e.g. a status chip and monospace log lines suggesting a "404"/runtime-error result) rather than the plain "404 / Page not found" text

#### Scenario: Card layout consistent with existing empty states
- **WHEN** the not-found page renders
- **THEN** it uses the same structural pattern as other empty states in the app (dashed-border card, icon badge, title, description, CTA button), with a distinct icon and accent color (red/orange, error-toned) so it reads as an error state rather than a neutral "nothing here yet" state

### Requirement: Navigation recovery action
The not-found page SHALL always provide the user a way back into the app.

#### Scenario: User clicks the primary action
- **WHEN** the user clicks the page's CTA button
- **THEN** they are navigated to the home route via the existing `Link`/navigation mechanism (`@/i18n/navigation`)

### Requirement: Localized content
The themed 404 content SHALL be available in both supported locales.

#### Scenario: Portuguese locale
- **WHEN** the not-found page renders under the `br` locale
- **THEN** all displayed text (verdict label, log lines, title, description, CTA) is sourced from `web/messages/br.json`'s `NotFound` namespace, not hardcoded English

#### Scenario: English locale
- **WHEN** the not-found page renders under the `en` locale
- **THEN** all displayed text is sourced from `web/messages/en.json`'s `NotFound` namespace
