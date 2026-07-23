## Purpose

Defines the routed, locale-aware legal/policy pages (Terms of Use, Privacy, Cookies, Community Guidelines, Copyright, Moderation) and their shared presentation.

## Requirements

### Requirement: Legal pages are routed and locale-aware
The system SHALL expose six legal/policy pages (Terms of Use, Privacy, Cookies, Community Guidelines, Copyright, Moderation) at one fixed set of English URL slugs shared across every supported locale: `/terms`, `/privacy`, `/cookies`, `/community-guidelines`, `/copyright`, `/moderation`. The rendered content — title, "last updated" date, and body — is translated per locale; the slug itself does not change.

#### Scenario: Visiting a legal page renders its content
- **WHEN** a user navigates to `/br/terms`
- **THEN** the page renders a title of "Termos de Uso", a "last updated" date, and the terms-of-use body content, all in Portuguese

#### Scenario: Same slug renders locale-appropriate content
- **WHEN** a user navigates to `/en/terms` vs `/br/terms`
- **THEN** both resolve under the identical `/terms` slug, with the title, "last updated" date, and body content translated into English for `en` and Portuguese for `br`

### Requirement: Legal pages share a consistent layout
Each legal page SHALL render its title and content through a shared page layout component that displays the page title, a "last updated" date, and prose-formatted body content.

#### Scenario: Two legal pages share layout structure
- **WHEN** comparing the rendered output of `/terms` and `/privacy`
- **THEN** both show a title heading, an "updated at" line in the same position/style, and body content in the same prose container styling

### Requirement: Legal page content supports inline emphasis and cross-links
Body text in legal pages SHALL support inline bold emphasis and links to other legal pages within the same translated string, without requiring a separate translation key per inline element.

#### Scenario: Bold label renders in list content
- **WHEN** the Privacy page's "data we collect" list renders
- **THEN** each item's leading label (e.g. "Account data:") renders as bold text (`<strong>`), followed by plain-text description

#### Scenario: Cross-link to another legal page renders as a link
- **WHEN** the Terms page's "Acceptable use" section renders
- **THEN** the phrase "Community Guidelines" renders as a link to `/community-guidelines`, inline within the surrounding paragraph text
</content>
