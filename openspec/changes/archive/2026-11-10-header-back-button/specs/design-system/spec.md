## ADDED Requirements

### Requirement: Header back button on nested pages
The shared `PageHeader` (and `ListPageHeader`) SHALL accept an optional `backHref`. When provided, the header SHALL render an icon-only back button (left arrow) before the icon badge that navigates to that explicit parent route via a locale-aware link, not via browser history. The button SHALL carry a localized accessible label (`aria-label` and `title`) from the `Common.back` message key in every supported locale. Every nested/detail page under `web/app/[locale]/` that has a hierarchical parent route and a page header SHALL pass its parent route as `backHref`; top-level destinations, editor workspaces (which have their own back rail item), redirect-only pages, and standalone pages SHALL NOT render it.

#### Scenario: Detail page shows back button to its parent
- **WHEN** a user opens `/classes/<slug>/lessons/<lesson>` directly (no prior history)
- **THEN** the page header shows a back icon button whose link target is `/classes/<slug>` in the current locale

#### Scenario: Accessible localized label
- **WHEN** the back button renders with locale `en` and then `br`
- **THEN** its accessible name is "Go back" and "Voltar" respectively

#### Scenario: Top-level page has no back button
- **WHEN** a user opens `/classes`, `/contests`, `/problems` or `/home`
- **THEN** the page header renders no back button

#### Scenario: No duplicate back links
- **WHEN** a page renders the header back button
- **THEN** it does not also render a separate text "Back to …" link to the same parent
