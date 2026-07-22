## Context

Web app: Next.js 16 App Router, `next-intl` locale routing (`web/app/[locale]/`), Radix-based shadcn-style primitives in `web/components/ui/`, `better-auth` client for auth (`authClient.signOut()`). No `cmdk`, no global keyboard listener, no admin/dashboard route today. Existing create flows: `problems/new` page, contest create dialog. Existing appearance-theme system already ships (`theme-customization` capability, `/settings`).

## Goals / Non-Goals

**Goals:**
- Single global palette, `Cmd/Ctrl+K` from anywhere, closes on Esc/outside-click/selection.
- Static-per-session command registry: navigation, create actions, logout, theme switch.
- Fuzzy filter over command labels (and optional keywords) as user types.
- Full keyboard operability (arrow up/down, Enter, Esc) — mouse optional.
- Locale-safe: all routes pushed thru `web/i18n/navigation.ts`, all labels thru `next-intl`.

**Non-Goals:**
- No generic "edit arbitrary config" surface — palette only launches existing settings/create UI, doesn't itself mutate data.
- No server-side command registry / permissions engine — commands are a static client list, filtered client-side by session role if needed (e.g. hide admin-only commands for non-admins) but not fetched from server.
- No command history/analytics persistence in this change.
- No mobile-specific trigger (long-press etc.) — desktop keyboard shortcut only for v1.

## Decisions

**cmdk for the primitive.** shadcn's own `command.tsx` recipe wraps `cmdk`; it's the de facto standard for this pattern, gives filtering/keyboard-nav for free, and matches the Radix-composition style already used by `dialog.tsx`. Alternative (hand-rolled filter + Radix Dialog) rejected — reinvents cmdk's a11y/keyboard handling for no benefit.

**Palette rendered inside `dialog.tsx`'s Radix Dialog primitive**, not a bespoke overlay — keeps focus-trap/Esc/outside-click behavior consistent with rest of app.

**Static command registry, single module** (`web/components/command-palette/commands.ts`) exporting a plain array of `{ id, group, labelKey, icon, action }`, where `action` is either a locale-aware navigation (`router.push` via `useRouter` from `web/i18n/navigation.ts`) or a callback (open create-contest dialog, call `authClient.signOut()`, set theme). Chosen over a plugin/registration-hook system — no current need for other features to register commands dynamically; YAGNI.

**Create-problem/create-contest launched via existing entry points**, not reimplemented: navigating to `problems/new`, and for contests either navigate to `/contests` and trigger the existing dialog via a query param/state, or (simpler) just navigate to contests page and let user click Create there if a direct dialog-open-from-elsewhere hook doesn't already exist. Exact wiring decided at implementation time by checking `contests/_components/create/dialog.tsx`'s trigger.

**Keyboard listener mounted once** at root layout (`web/app/[locale]/layout.tsx`) via a small client component/hook (`useCommandPaletteShortcut`), toggling open state via context, so any future component (e.g. header button) can also open it.

**Theme switch as inline sub-list**, not a separate flow — selecting "Change theme" reveals theme options in the same palette (cmdk supports nested pages/groups), avoiding an extra navigation hop to `/settings`.

## Risks / Trade-offs

- [Global `Cmd/Ctrl+K` may collide with browser/OS bindings] → `preventDefault()` on keydown only when palette closed and target isn't an input/textarea already capturing the combo; test in target browsers.
- [cmdk adds a new runtime dep] → small, widely used (shadcn standard), acceptable.
- [Static command list can drift from real routes if pages renamed] → keep command registry colocated in one file, reference `web/i18n/navigation.ts` route helpers rather than hardcoded strings where possible.
- [Non-authed users seeing "logout"/create commands] → filter registry by session (existing auth/session hook) before rendering.

## Migration Plan

Additive only — new component tree + root layout mount + new deps/messages. No data migration. Rollback = remove layout mount (feature flag not needed given low blast radius).

## Open Questions

- Exact mechanism to open the existing contest-create dialog from outside `contests/_components/` (route+query param vs. shared open-state context) — resolve by reading `contests/_components/create/dialog.tsx` during implementation.
- Whether to gate any commands by role (none currently, since no admin route exists) — leave registry role-filter as a no-op hook for now.
