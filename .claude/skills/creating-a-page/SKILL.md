---
name: creating-a-page
description: Use when adding a new page under web/app/[locale]/, or when a page's header/spacing/typography looks inconsistent with the rest of the app (wrong title size, missing subtitle, custom icon markup instead of the shared header, mismatched top margin/max-width). Triggers on "new page", "add a page", "page header doesn't match", "looks off compared to other pages".
metadata:
  author: whowon
  version: "1.0"
---

# Creating a Page (WhyRunner web)

## Why this exists

The `/feed` page was built with bespoke header JSX instead of the shared `PageHeader` component. It drifted from `/problems` and `/contests`: smaller icon (no badge box), smaller title, no subtitle, different top spacing. Read `openspec/specs/design-system/spec.md` before writing a new page — it's short and normative, not just a style guide.

## Checklist for a new page

1. **Container width & spacing.** Outer page component (`page.tsx`):
   ```tsx
   <div className="flex w-full flex-1 flex-col items-center gap-4 p-4">
     <YourPageContent />
   </div>
   ```
   Inner content component owns `w-full max-w-5xl mx-auto flex-1 flex flex-col gap-4 py-8`. `max-w-5xl` is mandatory — no `max-w-4xl`/`max-w-6xl`/`max-w-7xl` for a top-level container (see `design-system` spec, "Consistent page container width").

2. **Header — use the shared component, don't hand-roll icon+`<h1>`.**
   - List-style page (has search/filter, e.g. a table or grid of items): use `ListPageHeader` (`components/list-page-header.tsx`) — bundles `PageHeader` + search input + filter slot.
   - Any other page needing a titled header (no search/filter): use `PageHeader` directly (`components/page-header.tsx`).
   ```tsx
   <PageHeader icon={SomeLucideIcon} title={t("title")} subtitle={t("subtitle")} action={optionalButton} />
   ```
   This gives the icon badge (`p-2 border bg-primary/10`), `text-2xl font-bold tracking-tight` title, and `text-muted-foreground text-sm` subtitle for free. Never write a standalone `<Icon /> <h1>` pair — that's exactly the drift this skill exists to prevent.

3. **Subtitle is required, not optional.** Add a `subtitle` key next to the page's `title` key in both `web/messages/en.json` and `web/messages/br.json`.

4. **Everything else zero-radius/flat/monospace is automatic** via `globals.css` tokens and `components/ui/*` — don't override `rounded-*` or add `shadow-*` for elevation; use `border` instead.

## Before shipping

Compare your new page's header against `/problems` or `/contests` in the running app (or read their `page.tsx` + list component) — icon badge, title size, subtitle, top spacing should look identical, only the words differ.

## Reference

`openspec/specs/design-system/spec.md` is the source of truth; `web/components/page-header.tsx` and `web/components/list-page-header.tsx` are the two components to reuse.
