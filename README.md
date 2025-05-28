# 🏃 Runner - Online Judge System

Runner is a blazing-fast, containerized online judge system designed for running and evaluating C++ submissions in a secure, isolated environment. Built with **Next.js**, **Bun**, **BullMQ**, **PostgreSQL**, and **Redis**, it's optimized for speed and developer productivity.

## 🚀 Features

- 🖥️ Modern frontend powered by **Next.js**.
- ⚡ Ultra-fast backend scripts using **Bun**.
- 📝 Job queue handling with **BullMQ** and **Redis**.
- 🐳 Secure execution of C++ code inside **Docker** containers.
- 🗃️ PostgreSQL database for problem and submission management.
- ✅ Automated testing: compares program output against expected results.
- 🔄 Supports multiple test cases per problem.

## 🏗️ Architecture

```plaintext
Next.js (Frontend & API Routes)
 └──> BullMQ (Job Queue)
       └──> Bun Worker (consumes jobs)
             └──> Docker Container (C++ runner)
                   └──> Output validation
```

## 📦 Tech Stack

- **Frontend**: Next.js
- **Queue**: BullMQ + Redis
- **Runner**: Bun + Docker + GCC
- **Database**: PostgreSQL
- **Schema**: Prisma

## ⚙️ How it works

1. **User submits** C++ code via Next.js frontend.
2. Job is queued to **Redis** using **BullMQ**.
3. **Bun worker** picks the job, fetches problem details from **PostgreSQL**.
4. Code and inputs are prepared in `/tmp` and mounted into a **Docker** container.
5. C++ code is compiled and executed inside the container.
6. Output is compared with expected output, and status (`PASSED` / `FAILED`) is updated in the DB.

## 🐳 Docker C++ Runner

Minimal image using `gcc:13`. It compiles `code.cpp`, runs it against input files, and compares outputs.

## 🛠️ Setup

1. Install dependencies:
   ```bash
   bun install
   ```

2. Set environment variables in `.env`:
   ```bash
   DATABASE_URL=postgres://user:password@localhost:5432/runner
   REDIS_URL=redis://localhost:6379
   BACKEND_URL=http://localhost:3000
   ```

3. Run Bun worker:
   ```bash
   bun run src/worker.ts
   ```

4. Start Next.js app:
   ```bash
   npm run dev
   ```

## 🚨 Important

- **Ensure** Docker is running and `runner-cpp` image is built.
- Make sure `/tmp` directory is writable by Bun.

## 🤝 Contributing

PRs and suggestions are welcome! Let's make Runner the fastest online judge out there.

## 📄 License

MIT License
