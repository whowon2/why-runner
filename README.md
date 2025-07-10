You're right — here's the full `README.md` **as plain Markdown**, so you can copy and paste it directly into your project without escaping:

---

# 🏃‍♂️ Runner: Code Execution Platform

This is a TCC (Trabalho de Conclusão de Curso) project designed to support the execution and evaluation of code submissions in multiple programming languages inside isolated environments (containers). It includes a web interface, API, and infrastructure to run, test, and manage code for contests and problem solving.

## 📦 Monorepo Stack

* **Monorepo:** [Nx](https://nx.dev/) for project structure and dependency graph
* **Runtime:** [Bun](https://bun.sh/) for fast JavaScript/TypeScript execution
* **Linter/Formatter:** [Biome](https://biomejs.dev/) for code quality
* **Containers:** Docker + Docker Compose for service orchestration
* **Database:** PostgreSQL
* **Cache/Queue:** Redis (for job queueing and caching)
* **Runners:** Language-specific isolated containers (e.g., `cpp`, `python`)

---

## 🧱 Project Structure

```
.
├── apps/
│   ├── web/               # Frontend client
│   ├── api/               # API using tRPC or REST
├── packages/
│   ├── runners/
│   │   ├── cpp/           # Dockerfile for C++ execution environment
│   │   └── rust/          # (Optional) Rust runner
├── infra/
│   └── docker-compose.yml
├── .biome.json            # Biome config
├── nx.json                # Nx project config
├── bun.lockb              # Bun lock file
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

* [Docker](https://www.docker.com/)
* [Bun](https://bun.sh/)
* [Nx CLI](https://nx.dev/cli/nx)

### Development Setup

```bash
# Install dependencies
bun install

# Start all services
docker compose up --build
```

> The services will include:
>
> * `runner-db` (PostgreSQL)
> * `runner-redis` (Redis)
> * `runner-cpp` (C++ sandbox environment)

---

## 🧪 Features

* ✅ Secure code execution with time/resource limits
* ✅ Isolated runner containers per language
* ✅ Queue-based task processing (Redis)
* ✅ API for managing contests, problems, and submissions
* ✅ Code diffing and test case validation
* ✅ Realtime feedback for submissions

---

## 🧰 Commands

### Lint & Format

```bash
bun run lint        # via Biome
bun run format
```

### API Dev Server

```bash
nx run api:dev
```

### Web App

```bash
nx run web:dev
```

---

## 🐳 Docker Compose Services

```yaml
services:
  db:
    image: postgres:17.4
    container_name: runner-db
    restart: always
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: runner

  redis:
    container_name: runner-redis
    image: redis:latest
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s
    restart: always

  cpp:
    container_name: runner-cpp
    image: runner-cpp
    build:
      context: packages/runners/cpp
      dockerfile: Dockerfile
    command:
```

> Add more runners (e.g., `python`, `rust`) in the `packages/runners` directory.

---

## 📚 Technologies

| Tech       | Usage                        |
| ---------- | ---------------------------- |
| Bun        | Package manager + runtime    |
| Nx         | Monorepo orchestration       |
| Biome      | Linting/formatting           |
| Docker     | Service and runner isolation |
| PostgreSQL | Persistent database          |
| Redis      | Queueing, caching            |
| tRPC       | Type-safe API (or REST)      |

---

## 📖 Future Improvements

* [ ] WebSocket for live execution updates
* [x] Multi-language support (Rust, Python, Java)
* [ ] Admin panel to manage users/problems
* [ ] Advanced security sandbox (e.g., seccomp, firejail)

---

## 🧑‍💻 Author

**Juan Israel** – *Computer Engineering Student*
TCC Advisor: *Prof. \[Your Advisor’s Name]*
Institution: *\[IFMG]*

---

## 📜 License

MIT License. See `LICENSE` for more info.

---

Let me know if you'd like to include a logo, deployment steps, or CI/CD instructions!
