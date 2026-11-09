## Context

`getClass` returns `members` (students) and `coTeachers` in `joinedAt` order. `buildGradebook` and `buildClassResults` each inline `a.name.localeCompare(b.name) || a.username.localeCompare(b.username)`, which uses the runtime's default locale (on Vercel/Node usually `en-US`) and default sensitivity.

## Goals / Non-Goals

**Goals:** one comparator, pt-BR, case/accent-insensitive, username tiebreak, used by the class page roster, the gradebook and the results export.

**Non-Goals:** user-selectable sort on the roster; changing contest standings order; sorting in SQL.

## Decisions

- **Sort in JS with `Intl.Collator("pt-BR", { sensitivity: "base" })`, not SQL `ORDER BY`.** Postgres collation depends on the DB's locale/ICU setup (Neon vs local) and `lower()`/`unaccent` would need an extension. Rosters are small (tens of rows), so sorting in the server action is free and deterministic across environments.
- **`sensitivity: "base"`** makes "ana" = "Ana" = "Ána" equal, so the username tiebreak decides — stable, deterministic order. One module-level collator instance (construction is the costly part).
- **Shared `compareByName` in `web/lib/compare-by-name.ts`** taking `{ name, username }`, reused by the three call sites so the views never disagree.
- **Teachers first** is already the page layout (teachers card above students card, owner before co-teachers); only co-teachers get sorted inside their group.

## Risks / Trade-offs

- [Runtime without full ICU] → Node ships full ICU by default since v13; Vercel/Bun both do. Unit test asserts accent ordering so a regression shows up.
