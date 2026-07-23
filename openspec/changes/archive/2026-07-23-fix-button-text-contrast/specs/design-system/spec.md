## ADDED Requirements

### Requirement: Matched foreground/background color token pairs
Shared interactive component variants in `web/components/ui/` SHALL pair each background color token (e.g. `bg-primary`, `bg-secondary`, `bg-accent`, `bg-destructive`) with its correspondingly named foreground token (e.g. `text-primary-foreground`, `text-secondary-foreground`, `text-accent-foreground`, `text-destructive-foreground`) rather than a foreground token from a different pair, so text remains legible in both light and dark mode.

#### Scenario: Button secondary variant uses matching foreground token
- **WHEN** a `Button` with `variant="secondary"` renders in light or dark mode
- **THEN** its label text uses the `--secondary-foreground` token (not `--primary-foreground` or any other mismatched token), maintaining readable contrast against `--secondary`

#### Scenario: Shared primitive variant defines an explicit foreground pairing
- **WHEN** a `components/ui/` primitive defines a variant with a `bg-<token>` class
- **THEN** that same variant also defines a `text-<token>-foreground` class using the matching token name
