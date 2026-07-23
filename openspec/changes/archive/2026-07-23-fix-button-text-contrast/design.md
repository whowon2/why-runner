## Context

`components/ui/button.tsx`'s `secondary` variant is `bg-secondary text-primary-foreground`. `globals.css` defines `--secondary`/`--secondary-foreground` as a matched pair (light: `oklch(0.93 0.03 145)` / `oklch(0.25 0.08 145)`; dark: `oklch(0.2 0.05 145)` / `oklch(0.85 0.1 145)`), but `--primary-foreground` is an unrelated near-black/near-white token meant for `bg-primary`. In dark mode this puts a near-black label on a dark green background — effectively invisible, as seen on `/user`'s "Meus Problemas" cards (`variant="secondary"` buttons: "Continuar Editando", "Ver Detalhes").

An audit of `components/ui/*.tsx` (grep for `text-*-foreground` usages) found this is the only bg/foreground mismatch in the shared primitives — `badge.tsx`'s equivalent `secondary` variant already correctly pairs `bg-secondary text-secondary-foreground`.

## Goals / Non-Goals

**Goals:**
- Restore readable contrast on every `Button` `variant="secondary"` instance, in both light and dark mode.
- Prevent regression by documenting the pairing rule as a design-system spec requirement.

**Non-Goals:**
- Redesigning the color palette or token values themselves.
- Auditing app-level (non-`components/ui/`) one-off className usage outside shared primitives.

## Decisions

- **Change `text-primary-foreground` → `text-secondary-foreground` on `button.tsx`'s `secondary` variant.** This is a one-line fix using an already-defined, already-correctly-paired token — no new CSS variables needed. Alternative considered: redefine `--primary-foreground` to work on green backgrounds too — rejected, since that would weaken contrast for the (more common) `default`/`bg-primary` variant instead.
- **Record the pairing rule in `design-system` spec rather than only fixing the code.** The repo has no automated contrast lint; a spec requirement gives future changes a documented scenario to check against during review.

## Risks / Trade-offs

- [Fix only covers `components/ui/`] → Non-goal explicitly scopes the audit there; any app-level hardcoded mismatches are out of scope for this change.
- [No automated enforcement] → Spec requirement is documentation-level only (no lint rule added); acceptable given this repo has no existing accessibility/contrast tooling to hook into.
