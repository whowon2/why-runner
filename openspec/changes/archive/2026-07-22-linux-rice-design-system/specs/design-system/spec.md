## ADDED Requirements

### Requirement: App-wide monospace typography
The system SHALL use a monospace typeface as the default font for all UI text (body, headings, buttons, inputs, nav), loaded via `next/font/google` and exposed through the `--font-sans` CSS variable, rather than a proportional sans-serif.

#### Scenario: Default page renders in monospace
- **WHEN** any page in `web/app/[locale]/` renders without an element-level font override
- **THEN** its text is rendered in the app's configured monospace font (not a system sans-serif fallback)

#### Scenario: Font loads without layout shift
- **WHEN** the app first loads in a browser
- **THEN** the monospace font is self-hosted/optimized via `next/font` so no external font request occurs and no visible flash of unstyled/fallback text causes layout shift

### Requirement: Zero-radius component surfaces
The system SHALL set the shared `--radius` design token to `0`, so all shadcn/Radix primitives (buttons, cards, inputs, dialogs, popovers, badges, dropdowns) render with sharp rectangular corners by default.

#### Scenario: Shared primitive renders sharp corners
- **WHEN** a component from `web/components/ui/` (e.g. Button, Card, Dialog) is rendered without a component-level radius override
- **THEN** its computed border-radius is `0`

### Requirement: Flat, bordered elevation
The system SHALL express surface elevation (cards, dialogs, popovers, dropdown menus) in shared `components/ui/` primitives using borders (the `--border` token) instead of box-shadow.

#### Scenario: Dialog renders without drop shadow
- **WHEN** a Dialog, Popover, or DropdownMenu from `web/components/ui/` opens above page content
- **THEN** it is visually separated from the page using a border and/or backdrop overlay, not a box-shadow

### Requirement: Single-accent terminal color palette
The system SHALL define the `:root` and `.dark` OKLCH color tokens in `web/app/globals.css` using a flat near-black/near-white background pairing and a single accent hue reused across `--primary`/`--secondary`/`--ring`-equivalent roles, rather than multiple competing accent colors.

#### Scenario: Light and dark mode both use the same accent hue
- **WHEN** the app is viewed in light mode and then switched to dark mode
- **THEN** the same single accent hue is used for interactive/accent elements in both modes (only lightness/chroma may adjust)

### Requirement: No decorative animated gradients
The system SHALL NOT render animated decorative gradient-blob backgrounds (the `animate-first` through `animate-fifth` keyframe utilities and their consuming markup) anywhere in the app.

#### Scenario: Gradient-blob keyframes and markup are absent
- **WHEN** `web/app/globals.css` and the component tree are inspected after this change
- **THEN** no `@keyframes` named `moveHorizontal`, `moveVertical`, or `moveInCircle` exist, and no component renders the animated gradient-blob elements that previously used them

### Requirement: Consistent page container width
The system SHALL use the same content max-width (`max-w-5xl`) for the top-level page container on `/`, `/user`, `/roadmap`, `/contests`, and `/problems`, rather than each page choosing its own width.

#### Scenario: Top-level pages share one container width
- **WHEN** the home, user profile, roadmap, contests, and problems pages are inspected
- **THEN** each page's outermost content container uses the same `max-w-5xl` class (no page uses `max-w-4xl`, `max-w-6xl`, or `max-w-7xl` for its top-level container)

### Requirement: Shared list-page header pattern
The system SHALL render a shared header component on every list-style page (at minimum `/problems` and `/contests`) consisting of, in order: an icon badge, a title, a subtitle, a primary "create new" action button, a search input, and a filter control.

#### Scenario: List page renders all header elements
- **WHEN** a list-style page (e.g. `/problems` or `/contests`) renders
- **THEN** its header displays an icon badge, a title, a subtitle, a create/primary action button, a search input, and a filter control, all via the same shared header component

#### Scenario: List pages share header markup
- **WHEN** the `/problems` and `/contests` page headers are inspected
- **THEN** both consume the same shared header component rather than each defining independent header JSX
