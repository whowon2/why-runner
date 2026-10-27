## ADDED Requirements

### Requirement: CI runs on pull requests and main
The repository SHALL run a GitHub Actions workflow on every pull request and on every push to `main`. A PR SHALL show a failing check when any job fails.

#### Scenario: PR opened
- **WHEN** a pull request targeting any branch is opened or updated
- **THEN** the `web`, `judge` and `enum-sync` jobs run and report status on the PR

### Requirement: Web checks
The `web` job SHALL install dependencies from the frozen lockfile, generate Next.js types, and fail if `tsc --noEmit`, `bun run lint` or `bun test` fails. It SHALL NOT require a database or any secret.

#### Scenario: Type error introduced
- **WHEN** a change in `web/` introduces a TypeScript error
- **THEN** the `web` job fails at the typecheck step

#### Scenario: Unit test fails
- **WHEN** a `*.test.ts` file under `web/` fails
- **THEN** the `web` job fails

### Requirement: Judge checks
The `judge` job SHALL fail if `cargo fmt --check` fails, if clippy reports a warning not on the documented allow-list, or if a test fails. Tests that need the real `isolate` sandbox (`grade_tests`) SHALL be skipped in CI. All other tests SHALL run.

#### Scenario: Unformatted Rust
- **WHEN** a change leaves `judge/src` not formatted by rustfmt
- **THEN** the `judge` job fails at the fmt step

#### Scenario: Sandbox tests skipped
- **WHEN** the `judge` job runs tests
- **THEN** the `grade_tests` module is skipped and every other test module runs

### Requirement: Enum sync check
`scripts/check-enum-sync.ts` SHALL compare every Rust enum in `judge/src/models.rs` that has a `#[sqlx(type_name = "...")]` attribute against the Drizzle `pgEnum` with the same Postgres type name in `web/drizzle/schemas/`. It SHALL derive each Rust label by applying the enum's `rename_all` rule (or a per-variant `rename`) to the variant name, and SHALL exit non-zero on any mismatch. It SHALL check at least `submission_status`, `language`, `problem_constraint_kind` and `structural_constraint_rule_type`.

#### Scenario: Value added on both sides
- **WHEN** a new variant is added to a Rust enum and the matching label is added to the Drizzle `pgEnum`
- **THEN** the check passes without any change to the script

#### Scenario: Value added on one side only
- **WHEN** a label exists in the Drizzle `pgEnum` but no Rust variant maps to it (or the reverse)
- **THEN** the check exits non-zero and names the enum and the missing labels on each side

#### Scenario: Missing counterpart
- **WHEN** a Rust sqlx enum's type name has no matching `pgEnum` in the Drizzle schemas, or one of the required type names cannot be found
- **THEN** the check exits non-zero
