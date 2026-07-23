## ADDED Requirements

### Requirement: Feed page header follows shared design system pattern
The `/feed` page SHALL render its header using the shared `PageHeader` component (icon badge, title, subtitle) rather than page-specific markup, matching the header treatment used on `/problems` and `/contests`.

#### Scenario: Feed header matches shared header component styling
- **WHEN** the `/feed` page header is inspected
- **THEN** it renders via the same `PageHeader` component consumed by `/problems` and `/contests`, with the same icon badge, title size, and subtitle line
