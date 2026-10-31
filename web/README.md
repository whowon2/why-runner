# WhyRunner web

The Next.js web app for WhyRunner: the UI plus the server actions behind it. For the overview, architecture, environment variables and deployment, see the [root README](../README.md). Code conventions are in [`CLAUDE.md`](CLAUDE.md).

## Tech stack

- **Framework:** [Next.js](https://nextjs.org/) 16 (App Router, server actions) and React 19
- **Runtime and package manager:** [Bun](https://bun.sh/)
- **Lint and format:** oxlint and oxfmt
- **UI:** Tailwind CSS v4, Radix UI, Motion, Monaco Editor, Blockly
- **Database:** PostgreSQL with [Drizzle ORM](https://orm.drizzle.team/)
- **Auth:** [Better Auth](https://better-auth.com/) (email/password, GitHub, Google)
- **i18n:** next-intl (`br`, `en`)
- **Validation:** Zod

## Commands

```bash
bun install
bun dev            # dev server (in a worktree: bun dev -p $DEV_PORT)
bun run build      # runs migrations on production builds, then next build
bun run lint       # oxlint
bun run format     # oxfmt
bun test           # unit tests for pure modules

bun db:migrate     # apply drizzle/migrations
bun db:generate    # generate a migration from schema changes
bun db:push        # push the schema without a migration file
bun db:studio      # Drizzle Studio
bun db:seed        # seed data (also db:seed:lessons, db:seed:admins)
```

## How it talks to the judge

A server action writes a `PENDING` submission row and calls `pg_notify('new_submission', id)` (`lib/judge.ts`). The Rust judge in [`../judge`](../judge/README.md) listens on that channel, with a periodic sweep as a fallback. It runs the code in an `isolate` sandbox and writes the verdict back to the same row, and the UI polls that row with React Query. The web and the judge share only the database; there is no message queue.

## Author

**Juan Israel**, Computer Engineering, IFMG. TCC advisor: Prof. Suelen.
