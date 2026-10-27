## Context

There is no `.github/` yet. On current `main`:
- `web`: `tsc --noEmit` and `bun test` (72 tests) pass. `oxlint` reports 4 errors: 2 unused variables and 2 `nextjs/no-img-element`.
- `judge`: `cargo fmt --check` passes. `cargo clippy -- -D warnings` fails on 11 pre-existing warnings: 7 naming warnings (`upper_case_acronyms`, `non_camel_case_types`) on `SubmissionStatus`, whose variant names mirror the DB labels; 3 `collapsible_if`; 1 `dead_code` on `ProblemConstraint.description`. `cargo test -- --skip grade_tests` runs the 16 pure tests. The 13 `grade_tests` need `isolate` and elevated capabilities.
- Four branches are open in parallel (judge verdicts, judge concurrency, plagiarism, gradebook). They edit `judge/src` and `web/` heavily.

## Goals / Non-Goals

**Goals:** a blocking CI that is green on current `main`; an enum-sync check that keeps working when values are added; very few edits to application files.

**Non-Goals:** running `grade_tests` in CI (that needs a privileged container with isolate, a possible follow-up); `next build` (it needs env vars and a DB-aware migration script); deploy pipelines; fixing the existing clippy style warnings in source.

## Decisions

- **One workflow file, three parallel jobs.** Each job runs from its own subdirectory, matching the repo convention of no root-level tooling. Alternative: separate workflows with path filters. Rejected: path filters would skip enum-sync when only one side changes, and the whole run is fast anyway.
- **Clippy allow-list on the command line, not in `Cargo.toml` `[lints]` or source attributes.** The flags are `-A clippy::upper_case_acronyms -A non_camel_case_types -A clippy::collapsible_if -A dead_code`. `Cargo.toml` and `models.rs` are being edited by the parallel judge branches, so changes there risk merge conflicts. The naming lints are intentional (variant names equal the DB labels). `collapsible_if` is a style lint. `dead_code` covers the sqlx `FromRow` field that is only read via `Debug`. Every other clippy warning is denied.
- **Skip sandbox tests with `--skip grade_tests`, not a test filter allow-list.** New pure test modules then run automatically.
- **`next typegen` before `tsc`.** `next-env.d.ts` is gitignored, and without it `tsc` cannot resolve CSS/image module declarations in a clean checkout.
- **Enum-sync is pure text parsing in a Bun script with no imports.** It matches the Rust `#[sqlx(...)]` attribute (single- or multi-line), the `enum` body, and per-variant `#[sqlx(rename = "...")]`. It implements sqlx's rules: `lowercase`, `UPPERCASE`, `snake_case`, `SCREAMING_SNAKE_CASE`, `kebab-case`, `camelCase`, `PascalCase`. Unknown rules make the script fail. On the TS side it matches `pgEnum("name", [ ...string literals... ])`. Pairing is by Postgres type name, so enums added later are covered once they carry an sqlx `type_name`. Alternative: import the Drizzle schemas and read `.enumValues`. Rejected: that pulls the full Drizzle import graph, and some enums are built from constants in other modules. Text parsing fails loudly instead: a `pgEnum` whose values are not an inline literal array is reported as unparseable only when the Rust side needs it.
- **Lint fixes:** turn off `nextjs/no-img-element` in `.oxlintrc.json` (the images are user avatars from arbitrary hosts, which `next/image` would need `remotePatterns` for). Change `catch (_e)` to `catch {}`, and change the unused destructured prop to `user: _user`. These are one-line edits, so conflict risk is low.

## Risks / Trade-offs

- [The regex parser misses unusual formatting] → a required type name that is not found fails the check, so a miss never passes silently.
- [The CLI allow-list hides future real issues of those four lint kinds] → the list is short, and the workflow comments explain each entry.
- [Parallel branches add enum values on one side only] → that is the purpose of the check; those branches must update both sides before merging.
- [No toolchain pinning means a new stable clippy can add lints] → accepted. Pin with `rust-toolchain.toml` later if it causes trouble.
