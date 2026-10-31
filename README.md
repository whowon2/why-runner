# WhyRunner

WhyRunner is a platform for teaching programming. Teachers create classes, lessons, problems and contests. Students submit code, and a sandboxed judge grades it against the problem's test cases. It is the TCC (undergraduate thesis) project of Juan Israel at IFMG.

The repository holds two services that share one PostgreSQL database:

- **`web/`**: Next.js 16 app (UI and server actions), deployed on Vercel.
- **`judge/`**: Rust worker that runs submissions in [`isolate`](https://github.com/ioi/isolate) sandboxes, deployed on Fly.io.

## Features

- **Languages:** C, C++, Java, Python, Rust and Portugol (`judge/src/models.rs`).
- **Verdicts:** `PASSED`, `WRONG_ANSWER`, `TIME_LIMIT_EXCEEDED`, `MEMORY_LIMIT_EXCEEDED`, `COMPILATION_ERROR`, `RUNTIME_ERROR`, plus `ERROR` for judge-side faults, which never count against the student.
- **Output comparison per problem:** `exact`, `tokens` (default), `float` (with an epsilon) or a custom `checker` program written by the author.
- **Problems:** Markdown and KaTeX statements, tags, difficulty, hidden test cases and JSON import. AI tools can review a draft (they suggest edge-case tests), suggest tags and draft a themed narrative.
- **Classes:** join by code, co-teachers, lessons with exercises, a gradebook with CSV export, and a review page for each lesson.
- **Exercise modes:** students answer in code, with Blockly blocks (compiled to Portugol), or with Parsons problems (reorder the solution's lines). Teachers can also set solution constraints for an exercise; the judge checks them with static analysis, and the web app classifies the algorithm with AI.
- **Contests:** public or private (private ones need join approval), live standings, an AI-assistance level per contest (`off` / `concept` / `hint` / `pinpoint`) and result export.
- **Plagiarism check:** similarity reports over a contest's or exercise's submissions, using token fingerprints with a boilerplate filter (`web/lib/similarity/`).
- **AI explanations** of failed submissions. Each call tries Claude Haiku first when `ANTHROPIC_API_KEY` is set, then falls back to Gemini Flash and Gemini Flash Lite (`web/lib/ai.ts`).
- **Editor workspace:** fullscreen Monaco editor, runs with custom input (never graded), and a play button on visible examples.
- **Themes:** six presets (linux rice, nord, gruvbox, dracula, solarized, vaporwave), each with light and dark variants, plus custom colors.
- **i18n:** Brazilian Portuguese (default) and English, via next-intl.
- **Also:** email/password, GitHub and Google login (Better Auth), notifications, a ctrl+k command palette, an admin area and evaluation surveys.

## Architecture

```mermaid
flowchart LR
    B[Browser] -->|server actions| W["web (Next.js on Vercel)"]
    W -->|"INSERT submission (PENDING)<br/>pg_notify('new_submission')"| DB[(PostgreSQL)]
    W -.->|"Fly Machines API start<br/>(if judge idle-stopped)"| J
    DB -->|"LISTEN new_submission / new_run / new_validation<br/>+ 60 s sweep"| J["judge (Rust on Fly.io)"]
    J -->|"claim row<br/>(FOR UPDATE SKIP LOCKED)"| DB
    J -->|compile + run each test case| S["isolate box<br/>(no network, time/memory limits)"]
    S -->|stdout, exit code, meta| J
    J -->|verdict + JSON report| DB
    B -.->|React Query polling| W
```

1. A `createSubmission` server action writes a `PENDING` row and calls `pg_notify('new_submission', id)`. If `FLY_API_TOKEN` is set, it also wakes a judge that stopped while idle.
2. The judge listens on that channel, and sweeps every 60 s in case it missed a notification. It claims the row atomically, so several replicas are safe. Rows stuck in `RUNNING` are retried and dead-lettered to `ERROR` after a fixed number of retries.
3. The judge compiles the code once, then runs it in a fresh network-less `isolate` box for each test case, and stops at the first failure.
4. The judge writes the verdict and a JSON report back to the same row. When the submission passes in a contest, it updates the standings in the same transaction. The browser polls until the status changes.

The services share no schema code. The Rust enums in `judge/src/models.rs` mirror the Drizzle enums in `web/drizzle/schemas/`, and CI checks that they match (`scripts/check-enum-sync.ts`).

## Tech stack

| Layer | Stack |
| --- | --- |
| Web | Next.js 16 (App Router, server actions), React 19, Bun, Tailwind CSS v4, Radix UI, React Query, React Hook Form + Zod, nuqs, Monaco, Blockly, next-intl |
| Auth | Better Auth (email/password, GitHub, Google) |
| Data | PostgreSQL, Drizzle ORM and drizzle-kit migrations |
| AI | Anthropic SDK (Claude Haiku) and Google GenAI (Gemini) |
| Other services | Vercel Blob (uploads), Resend (email, optional) |
| Judge | Rust 2024 edition, Tokio, sqlx, `isolate`; the judge image includes gcc/g++, rustc, JDK 21, Python 3 and the Portugol console jar |
| Tooling | oxlint and oxfmt (web), rustfmt and clippy (judge), GitHub Actions |

## Local setup

### Prerequisites

- [Bun](https://bun.sh/) (CI uses 1.3.12)
- Docker, which runs Postgres and the judge with the capabilities `isolate` needs
- Rust stable, only if you build or test the judge outside Docker

### 1. Database

`judge/compose.yml` starts a Postgres instance (user, password and database all `judge`, on host port 5433) and the judge worker:

```sh
cd judge
docker compose up -d db
```

### 2. Web

```sh
cd web
bun install
# create .env with the variables below first
bun db:migrate         # apply web/drizzle/migrations
bun dev                # http://localhost:3000
```

`web/env.ts` validates these environment variables at startup (Better Auth also reads its own):

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | Postgres URL, e.g. `postgres://judge:judge@localhost:5433/judge` |
| `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` | yes | Better Auth secret and base URL |
| `NEXT_PUBLIC_BETTER_AUTH_URL` | no | auth client base URL (default `http://localhost:3000`) |
| `GITHUB_ID`, `GITHUB_SECRET` | yes | GitHub OAuth |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | yes | Google OAuth |
| `GEMINI_KEY` | yes | Gemini API key |
| `BLOB_READ_WRITE_TOKEN` | yes | Vercel Blob, used for profile images |
| `ANTHROPIC_API_KEY` | no | puts Claude Haiku first in the AI provider chain |
| `RESEND_API_KEY`, `EMAIL_FROM` | no | sending email |
| `FLY_API_TOKEN`, `FLY_JUDGE_APP` | no | wakes an idle-stopped Fly judge (app name defaults to `why-runner-judge`) |
| `SURVEY_PREVIEW_EMAILS` | no | emails allowed to preview survey forms |
| `SURVEY_ADMIN_EMAILS` | seed only | `bun db:seed:admins` promotes these emails to admin |

Optional seed scripts: `bun db:seed`, `bun db:seed:lessons`.

### 3. Judge

The judge needs `isolate` and the `SYS_ADMIN` and `NET_ADMIN` capabilities, so the easiest way to run it is with the compose stack:

```sh
cd judge
# .env must contain DATABASE_URL; inside compose the database host is `db`, e.g.
# DATABASE_URL=postgres://judge:judge@db:5432/judge
docker compose up --build
```

Judge settings:

| Variable | Default | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | required | same database as the web app |
| `JUDGE_CONCURRENCY` | CPU count, capped at 4 | number of parallel worker slots (1 to 64) |
| `JUDGE_IDLE_EXIT_SECS` | unset (never exits) | exit after this many idle seconds (Fly uses `1800`) |
| `ISOLATE_TMPFS_SIZE` | `512m` | size of the tmpfs used as isolate's box root |

### Checks

| | Command |
| --- | --- |
| Web | `bunx tsc --noEmit`, `bun run lint`, `bun test` |
| Judge | `cargo fmt --check`, `cargo clippy`, `cargo test -- --skip grade_tests` |

The judge's `grade_tests` run real submissions through `isolate`, so they need the judge image. See `judge/CLAUDE.md` for the command.

## Deployment and versioning

- **Web:** Vercel. A production build runs `drizzle-kit migrate` before `next build` (`web/scripts/migrate-if-production.mjs`); preview builds skip the migration.
- **Judge:** Fly.io app `why-runner-judge` (`judge/fly.toml`: `shared-cpu-1x`, 2 GB RAM, region `gru`, stops after 30 minutes idle). On every push to `main`, CI builds and pushes `whowon/why-runner-judge` tagged `:latest`, `:sha-<commit>` and `:vX.Y.Z`. Fly does not pull the new image by itself, so deploy it by hand:

  ```sh
  cd judge && fly deploy -a why-runner-judge
  ```

  `judge/compose.prod.yml` and `judge/deploy/README.md` describe an alternative VPS deployment.

- **Versions:** `web/package.json` and `judge/Cargo.toml` each carry a semver version, bumped by hand in the PR that changes that service (patch for a fix, minor for a feature, major for a breaking change to the DB or judge contract). When `main` carries a new version, CI tags the commit `web-vX.Y.Z` or `judge-vX.Y.Z`. To see what is running: the judge logs `WhyRunner judge vX.Y.Z (<sha>)` at startup, and the web app shows `vX.Y.Z (<sha>)` in its footer and at `/api/version`.

## Repository map

| Path | Contents |
| --- | --- |
| [`web/`](web/README.md) | Next.js app: `app/[locale]/` pages, `lib/actions/` server actions, `drizzle/` schema and migrations, `messages/` translations |
| [`judge/`](judge/README.md) | Rust judge worker, Dockerfile, `fly.toml`, compose files, [`deploy/`](judge/deploy/README.md) VPS guide |
| [`bench/`](bench/README.md) | Reproducible benchmarks behind the thesis numbers (raw data in `bench/results/`) |
| `openspec/` | Spec-driven change workflow (`specs/` and archived `changes/`) |
| `overleaf/` | LaTeX source of the thesis (SBC template) |
| `docs/presentation/` | Deck build scripts, screenshots and charts |
| `scripts/` | Enum-sync check and git worktree helpers (`new-worktree.sh`, `prune-worktrees.sh`) |
| `.github/workflows/ci.yml` | CI: web and judge checks, enum sync, judge image, release tags |

Contributor and agent notes are in [`CLAUDE.md`](CLAUDE.md), [`web/CLAUDE.md`](web/CLAUDE.md) and [`judge/CLAUDE.md`](judge/CLAUDE.md).

The root also contains Portuguese-language thesis material: slide decks, the thesis PDF, the pre-defense audit, a sample `problems.json` and conference notes. Neither app uses these files at runtime.
