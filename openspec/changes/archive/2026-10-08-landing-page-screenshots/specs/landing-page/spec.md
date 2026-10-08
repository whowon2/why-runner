## ADDED Requirements

### Requirement: Submission workspace preview
The landing page SHALL show a screenshot of the contest problem workspace (problem statement, code editor, and submission list) in the "Live Submission Interface" section, rendered at the screenshot's natural aspect ratio without cropping.

#### Scenario: Visitor scrolls to the submission section
- **WHEN** a visitor scrolls past the hero to the submission section
- **THEN** the full contest problem workspace screenshot is visible, including the failed submission card at its bottom

### Requirement: AI assistant preview
The landing page SHALL display the AI assistant dialog screenshot overlapping the workspace preview, so the failed submission and the AI hint it produced read as one flow. On narrow (mobile) viewports the dialog screenshot SHALL be shown below the workspace preview instead of overlapping it.

#### Scenario: Desktop viewport
- **WHEN** the viewport is at least the `md` breakpoint
- **THEN** the AI assistant screenshot is layered over a corner of the workspace preview

#### Scenario: Mobile viewport
- **WHEN** the viewport is narrower than the `md` breakpoint
- **THEN** the AI assistant screenshot appears stacked below the workspace preview, not covering it

### Requirement: Problem library preview
The landing page SHALL include a section with a localized title and description that shows the problem list screenshot.

#### Scenario: Visitor views the problem library section
- **WHEN** a visitor scrolls to the problem library section
- **THEN** a heading, a short description, and the problem list screenshot are shown

### Requirement: Theme-matched screenshots
Every landing page screenshot SHALL use its light variant when the light theme is active and its dark variant when the dark theme is active, switching without a page reload and without a hydration mismatch.

#### Scenario: Dark theme
- **WHEN** the dark theme is active
- **THEN** only the `-dark` variants of the screenshots are visible

#### Scenario: Theme toggled
- **WHEN** the visitor switches theme while on the landing page
- **THEN** the visible screenshots switch to the matching variant immediately

### Requirement: Locally served, accessible screenshots
Landing page screenshots SHALL be served from the app's own bundle (no external blob URL) and SHALL carry localized alt text describing what each one shows.

#### Scenario: Screen reader user
- **WHEN** a screen reader reaches a screenshot
- **THEN** it announces the localized alt text for the current locale (en or br)

#### Scenario: Offline blob storage
- **WHEN** the Vercel Blob store is unreachable
- **THEN** the landing page screenshots still load
