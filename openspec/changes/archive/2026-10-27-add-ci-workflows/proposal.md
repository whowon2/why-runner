## Why

The repo has no CI: nothing checks a PR before merge, and several branches are now developed in parallel worktrees and merged back into `main`. The Rust enums in `judge/src/models.rs` and the Drizzle `pgEnum`s in `web/drizzle/schemas/` are kept in sync by hand, and a mismatch only shows up at runtime as a sqlx decode error in the judge.

## What Changes

- Add `.github/workflows/ci.yml`, run on pull requests and pushes to `main`, with three jobs:
  - **web**: `bun install --frozen-lockfile`, `next typegen` (creates the gitignored `next-env.d.ts`), `tsc --noEmit`, `bun run lint` (oxlint), `bun test`.
  - **judge**: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings` (with a few pre-existing lints allowed on the command line), `cargo test -- --skip grade_tests` (the `grade_tests` need a real `isolate` sandbox with elevated capabilities).
  - **enum-sync**: `bun scripts/check-enum-sync.ts`.
- Add `scripts/check-enum-sync.ts`. It parses the `#[sqlx(type_name = ..., rename_all = ...)]` enums in `models.rs`, applies sqlx's rename rules, and compares the resulting labels with the `pgEnum("<same type name>", [...])` values in the Drizzle schemas. It fails when a label is missing on either side. Enums are paired by Postgres type name, so values added later (e.g. new verdicts) need no change to the script.
- Minimal changes so CI passes on current `main`: in `web/.oxlintrc.json`, turn off `nextjs/no-img-element` (avatars are arbitrary external URLs), and fix two trivial unused-variable lint errors.

## Capabilities

### New Capabilities
- `continuous-integration`: what CI runs on each PR/push, and the enum-sync check between the judge and web schemas.

### Modified Capabilities
<!-- none -->

## Impact

- New: `.github/workflows/ci.yml`, `scripts/check-enum-sync.ts`.
- Touched (trivial): `web/.oxlintrc.json`, `web/lib/prompt.ts`, `web/app/[locale]/contests/_components/tabs/problem/select-problem.tsx`.
- No migrations, no runtime behaviour change. Branches that add enum values must update both sides in the same PR, or CI fails.
