## 1. Enum sync check

- [x] 1.1 Write `scripts/check-enum-sync.ts`: parse sqlx enums (`type_name`, `rename_all`, per-variant `rename`) in `judge/src/models.rs` and apply the sqlx rename rules
- [x] 1.2 Parse `pgEnum("name", [...])` literals across `web/drizzle/schemas/*.ts`
- [x] 1.3 Pair by type name, require the four known types, report labels missing on each side, exit non-zero on mismatch
- [x] 1.4 Verify: passes on current tree; fails when a label is added to only one side (temporary edit, reverted)

## 2. Make current main green

- [x] 2.1 Disable `nextjs/no-img-element` in `web/.oxlintrc.json`
- [x] 2.2 Fix the unused `_e` in `web/lib/prompt.ts` and the unused `user` prop in `select-problem.tsx`
- [x] 2.3 Verify `bun run lint` exits 0

## 3. Workflow

- [x] 3.1 Add `.github/workflows/ci.yml` with `web`, `judge` and `enum-sync` jobs (PR + push to main, concurrency cancel)
- [x] 3.2 web job: setup-bun, `bun install --frozen-lockfile`, `bunx next typegen`, `bunx tsc --noEmit`, `bun run lint`, `bun test`
- [x] 3.3 judge job: stable toolchain with rustfmt/clippy, cargo cache, `cargo fmt --check`, clippy with the documented allow-list and `-D warnings`, `cargo test -- --skip grade_tests`
- [x] 3.4 Verify the web steps in a clean checkout (no `.env`, no `next-env.d.ts`) and the judge commands locally
- [x] 3.5 Validate the workflow YAML (actionlint if available)
