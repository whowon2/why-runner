# 🏃‍♂️ Runner: Code Execution Platform web client

This is the main web application and API surface for the Runner platform (a TCC - Trabalho de Conclusão de Curso project). It's designed to support code submissions, evaluations, and contests using a modern, scalable web stack.

## 📦 Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) 16 (App Router) & React 19
- **Runtime & PM:** [Bun](https://bun.sh/)
- **Linter/Formatter:** [Biome](https://biomejs.dev/)
- **Styling:** Tailwind CSS v4, Framer Motion, Radix UI variants
- **Database & ORM:** PostgreSQL + [Drizzle ORM](https://orm.drizzle.team/)
- **Authentication:** [Better Auth](https://better-auth.com/)
- **Queueing:** PostgreSQL `LISTEN/NOTIFY` (to notify the Judge worker of new submissions)
- **Internationalization:** next-intl
- **Editor:** Monaco Editor
- **Validation:** Zod

## 🚀 Getting Started

### Prerequisites

- [Docker](https://www.docker.com/) (For PostgreSQL database)
- [Bun](https://bun.sh/) 

### Development Setup

1. **Install dependencies:**
   ```bash
   bun install
   ```

2. **Environment Configuration:**
   Create a `.env` file based on your local settings (Database, Auth secrets, etc.).

3. **Database Setup:**
   Run the database migrations and optionally seed the database:
   ```bash
   bun run db:push
   # Or using migrations
   bun run db:generate
   bun run db:migrate
   ```

4. **Start the Development Server:**
   ```bash
   bun run dev
   ```

### Other Commands

- `bun run lint` - Lint the codebase using Biome
- `bun run format` - Format the codebase using Biome
- `bun run db:studio` - Open Drizzle Studio to inspect the database GUI

## 🧪 System Architecture

1. **Web Frontend:** Displays problems, contests, leaderboards, and a code editor (Monaco).
2. **Web API / Actions:** Next.js Server Actions write a `PENDING` submission row to Postgres and call `pg_notify('new_submission', ...)`.
3. **Judge Worker (Rust):** A separate worker process (see the `judge` directory) listens on that Postgres channel (with a periodic sweep fallback), claims the row, executes the code inside a sandboxed Docker container per language, checks it against test cases, and saves the result to the DB.
4. **Realtime view:** Users see their submission test results updated in the web application.

## 🧑‍💻 Author

**Juan Israel** – *Computer Engineering Student*

TCC Advisor: *Prof. Suelen*
Institution: *IFMG*

## 📜 License

MIT License. See `LICENSE` for more info.
