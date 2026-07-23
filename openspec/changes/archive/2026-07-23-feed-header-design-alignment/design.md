## Context

`/problems` and `/contests` both render their list-page headers through the shared `components/page-header.tsx` (`PageHeader`) — either directly or wrapped by `components/list-page-header.tsx` (`ListPageHeader`, which adds a search box and filters on top of `PageHeader`). `/feed` instead hand-rolls an icon + `<h1>` directly inside `feed-tabs.tsx`, which is why its type scale, icon treatment, and spacing drift from the rest of the app. `/feed` has no search/filter UI, so it's a `PageHeader` case, not a full `ListPageHeader` case.

## Goals / Non-Goals

**Goals:**
- `/feed`'s header renders through `PageHeader` so icon badge, title size, and subtitle match `/problems`/`/contests`.
- Top-level page container spacing matches the `/problems`/`/contests` pattern.

**Non-Goals:**
- No change to the Following/Explore tab bar styling below the header.
- No search/filter UI added to `/feed` (out of scope; `ListPageHeader` isn't the right fit here).

## Decisions

- **Use `PageHeader` directly, not `ListPageHeader`.** `/feed` has no search or filter controls, so wrapping in `ListPageHeader` (which always renders a search input) would add UI that doesn't exist today and isn't requested. `PageHeader` alone gives icon badge + title + subtitle, which is what's actually misaligned.
- **Container structure mirrors `/problems`/`/contests`:** page-level wrapper drops to `flex w-full flex-1 flex-col items-center gap-4 p-4` (matching `problems/page.tsx`/`contests/page.tsx`), and the `max-w-5xl mx-auto ... py-8` wrapper moves into `feed-tabs.tsx` alongside the header/tabs, matching how `ListPageHeader` consumers keep their own `max-w-5xl` inner wrapper in the list component rather than the page component.

## Risks / Trade-offs

- [Changing page.tsx container class could shift spacing on nested elements relying on old padding] → Only `/feed` page tree touches this wrapper; verified visually as part of tasks.
