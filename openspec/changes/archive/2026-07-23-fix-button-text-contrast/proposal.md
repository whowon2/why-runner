## Why

The `secondary` `Button` variant pairs `bg-secondary` with `text-primary-foreground` instead of `text-secondary-foreground`. In dark mode `--primary-foreground` (near-black) sits on top of `--secondary` (dark green), producing near-zero contrast — visible as unreadable "Continuar Editando" / "Ver Detalhes" buttons on `/user`'s "Meus Problemas" list.

## What Changes

- Fix `components/ui/button.tsx` `secondary` variant to use `text-secondary-foreground` (the token already defined in `globals.css` for exactly this pairing) instead of `text-primary-foreground`.
- Add a design-system requirement that shared button variants pair each background token with its matching `-foreground` token, so this class of mismatch is caught by inspection/tests going forward.
- Audit other `components/ui/` primitives for the same bg/foreground token mismatch pattern (badges, cards) while in the area; fix any found.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `design-system`: adds a requirement that interactive component variants use color-token pairs with sufficient contrast (background token paired with its matching foreground token, not a mismatched one).

## Impact

- `web/components/ui/button.tsx` — `secondary` variant class fix.
- Any other `components/ui/` primitive found during audit with the same bg/foreground mismatch.
- No API, schema, or data changes.
