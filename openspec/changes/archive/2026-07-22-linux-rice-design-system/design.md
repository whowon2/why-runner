## Context

`web/app/globals.css` currently references `--font-geist-sans` but no font is actually loaded via `next/font` anywhere in `app/`, so the app silently falls back to system sans-serif. Radius is `0.625rem` (shadcn default), colors are neutral OKLCH grays with a single blue-violet `--secondary` accent, and `[locale]/page.tsx`-adjacent components use animated gradient-blob decorations (`animate-first`..`animate-fifth` keyframes in `globals.css`). All shadcn/Radix primitives in `components/ui/` consume the CSS variable layer (`--radius-*`, `--color-*`), so token changes cascade without per-component edits — the risk is components that hardcode `rounded-md`/`shadow-*` classes instead of using the variables.

## Goals / Non-Goals

**Goals:**
- Make monospace the default UI typeface app-wide (not just code/test-case blocks), loaded via `next/font/google` (`Geist_Mono`) for zero extra dependency and consistent with the existing (unused) `--font-geist-sans` naming.
- Flatten the visual language: `--radius: 0px`, borders over shadows, fewer gradients.
- Keep the existing shadcn variable contract (`--color-*`, `--radius-*` names) so `components/ui/*` need no per-file edits.
- Preserve light/dark mode parity — both `:root` and `.dark` get re-tuned, not just one.

**Non-Goals:**
- Not rewriting component structure/markup in `components/ui/*`.
- Not touching the code editor's own font config (Monaco/CodeMirror, wherever the problem-workspace editor lives) — that's likely already monospace; out of scope unless it inherits `--font-sans` and breaks.
- Not changing any functional/behavioral spec (routing, data, auth) — visual tokens only.
- Not introducing a new icon set, layout grid system, or component library.

## Decisions

- **Font: `next/font/google` `Geist_Mono`, not a self-hosted TTF or `JetBrains Mono`.** Zero new dependency (Next.js ships `Geist_Mono` in `next/font/google` already), matches the pre-existing `--font-geist-sans` variable naming convention in `globals.css`, and Next.js self-hosts/optimizes it automatically (no external network font request, no CLS). Load it in `web/app/[locale]/layout.tsx` next to (replacing) the currently-absent Geist Sans load, expose as `--font-geist-mono`, and point the `@theme` block's `--font-sans` at it (keep the token name `--font-sans` for compatibility with any Tailwind `font-sans` utility usage already in the codebase, rather than doing a mass find/replace to `font-mono`).
- **Radius: `--radius: 0rem` globally**, not a small non-zero value (e.g. `0.125rem`). A true rice/tiling-WM aesthetic is unambiguously sharp-cornered; keeping a tiny radius reads as "still rounded" at small component sizes (buttons, badges) and dilutes the change. Since every `--radius-sm/md/lg/xl` in the `@theme inline` block derives from this one variable, this is a single-line change.
- **Color palette: keep the OKLCH token structure, retune values, don't switch color systems.** Move backgrounds toward near-black/near-white flat tones with reduced use of mid-gray card/popover surfaces (currently `--card` and `--popover` sit close to background in light mode but jump to a lighter gray in dark mode `oklch(0.205 0 0)` — this is kept but bordered instead of shadowed). Pick a single accent hue re-using the existing `--secondary` slot (currently `oklch(0.623 0.214 260)`, a blue-violet) rather than adding a 6th chart-style accent — a rice setup typically has one accent color, not a rainbow. Chart colors (`--chart-1..5`) are left as-is since they're data-viz, not chrome, and changing them isn't part of this proposal's scope.
- **Elevation: replace `shadow-*` usage in shared `components/ui/*` primitives with `border` + the existing `--border` token**, rather than keeping shadows and just tinting them. Terminal/rice UIs read as flat; box-shadows imply a light source that doesn't fit the aesthetic. This only touches shared primitives (card, dialog, popover, dropdown-menu, etc.) — one-off page sections that already use borders are untouched.
- **Gradient blobs: delete the `animate-first`..`animate-fifth` keyframes and any JSX consuming them**, rather than keeping them as an opt-in "flair" utility. They're decorative motion that directly contradicts a minimalist rice look; keeping dead CSS around after removing the last consumer would just be unused-code debt.
- **Page container: standardize on `max-w-5xl`**, not `max-w-7xl` or `max-w-6xl`. `contests/_components/list.tsx` already uses `max-w-5xl` and already has the target header pattern (icon badge, title, subtitle, action button, search, filter); `problems/_components/list.tsx` (`max-w-7xl`) and the marketing/home/roadmap/user pages (`max-w-4xl`/`max-w-6xl`) are brought in line with it rather than picking a new width or widening the narrower pages up to `7xl` — a narrower, denser column reads more terminal/tiling-WM than a wide dashboard layout.
- **Shared list-page header: extract a single component** (e.g. `components/list-page-header.tsx`) modeled on the existing `contests/_components/list.tsx` header block (icon badge + title + subtitle on one side, primary action button on the other, search input + filter select below), rather than leaving each list page (`problems`, `contests`) with independently hand-rolled header JSX. `problems/_components/list.tsx` currently has only a bare `<h1>` + create button + search/filter with no icon or subtitle — it adopts the shared component instead of the contests page copying problems' simpler markup, since the contests version is the more complete pattern the proposal is standardizing on.

## Risks / Trade-offs

- [Global `--font-sans` swap to monospace changes line-height/character-width across every page] → Sweep the app visually (home, problems list, problem workspace, profile, contests) after the token change and adjust any layout that assumed proportional-font text width (e.g. truncation, badge sizing).
- [Removing gradient-blob keyframes breaks a page that still renders the blob divs] → grep for `animate-first|animate-second|animate-third|animate-fourth|animate-fifth` and the blob wrapper component before deleting the keyframes; remove both together.
- [Zero-radius buttons/inputs can look "broken" on iOS Safari form controls or clash with third-party embeds (e.g. Monaco's own rounded suggestion widget)] → Zero radius is a token change to shadcn primitives only; Monaco/CodeMirror render in their own shadow DOM-ish structure and aren't affected.
- [Flattening shadows to borders may reduce perceived hierarchy between overlapping surfaces (e.g. dialog over page)] → Rely on the existing dialog/overlay backdrop (`bg-black/50`-style overlay) for separation instead of shadow, which is standard in flat/terminal UIs.

## Open Questions

- Exact accent hue/lightness for the retuned `--secondary` — left to implementation-time visual judgment within "single accent, terminal-plausible" (e.g. green/amber/cyan on near-black), rather than over-specifying in the design doc.
