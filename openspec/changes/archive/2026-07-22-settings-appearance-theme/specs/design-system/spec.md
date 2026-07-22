## MODIFIED Requirements

### Requirement: Single-accent terminal color palette
The system SHALL define the `:root` and `.dark` OKLCH color tokens in `web/app/globals.css` as the default "linux rice" preset, using a flat near-black/near-white background pairing and a single accent hue reused across `--primary`/`--secondary`/`--ring`-equivalent roles. These token values MAY be overridden at runtime by the user's selected theme preset or custom theme (see `theme-customization`), but the shipped default and the values used when no user override is present SHALL remain this single-accent palette.

#### Scenario: Light and dark mode both use the same accent hue by default
- **WHEN** the app is viewed in light mode and then switched to dark mode, with no user theme override applied
- **THEN** the same single accent hue is used for interactive/accent elements in both modes (only lightness/chroma may adjust)

#### Scenario: User override takes precedence over the default palette
- **WHEN** a user has selected a non-default preset or a custom theme
- **THEN** the resulting colors are applied instead of the default single-accent values, without altering the zero-radius, no-gradient, or monospace-typography requirements
