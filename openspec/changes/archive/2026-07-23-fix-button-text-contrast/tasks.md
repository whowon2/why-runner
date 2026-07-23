## 1. Fix button contrast

- [x] 1.1 In `web/components/ui/button.tsx`, change the `secondary` variant's `text-primary-foreground` to `text-secondary-foreground`.

## 2. Verify

- [x] 2.1 Run `bun lint` in `web/`.
- [x] 2.2 Visually check `/user` "Meus Problemas" page in dark mode: "Continuar Editando" and "Ver Detalhes" buttons are legible.
- [x] 2.3 Visually check the same page in light mode: no regression.
- [x] 2.4 Grep other `components/ui/*.tsx` files for any additional `bg-<token> ... text-<other-token>-foreground` mismatches (confirm none besides the one fixed).
