# 🏃‍♂️ Runner: Code Execution Platform

This is a TCC (Trabalho de Conclusão de Curso) project designed to support the execution and evaluation of code submissions in multiple programming languages inside isolated environments (containers). It includes a web interface, API, and infrastructure to run, test, and manage code for contests and problem solving.

<img width="1250" height="792" alt="2025-07-10-130229_hyprshot" src="https://github.com/user-attachments/assets/bcbeea88-9a0a-40a7-bdea-9d1872cc5b82" />

## 📦 Monorepo Stack

* **Runtime:** [Bun](https://bun.sh/) for fast JavaScript/TypeScript execution
* **Linter/Formatter:** [Biome](https://biomejs.dev/) for code quality
* **Containers:** Docker + Docker Compose for service orchestration
* **Database:** PostgreSQL
* **Cache:** AWS SQS (for job queueing)
* **Runners:** Language-specific isolated containers (e.g., `cpp`, `python`, `rust`, `java`)

---

## 🚀 Getting Started

### Prerequisites

* [Docker](https://www.docker.com/)
* [Bun](https://bun.sh/)

### Development Setup

```bash
# Install dependencies
bun install

# Start all services
docker compose up --build
```
---

## 🧪 Features

* ✅ Secure code execution with time/resource limits
* ✅ Isolated runner containers per language
* ✅ Queue-based task processing (SQS)
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


### Web App

```bash
bun run dev
```

---


---

## 📚 Technologies

| Tech       | Usage                        |
| ---------- | ---------------------------- |
| Bun        | Package manager + runtime    |
| Biome      | Linting/formatting           |
| Docker     | Service and runner isolation |
| PostgreSQL | Persistent database          |
| SQS        | Queueing                     |
| tRPC       | Type-safe API (or REST)      |

---

## 📖 Future Improvements

* [ ] WebSocket for live execution updates
* [x] Multi-language support (Rust, Python, Java)
* [ ] Admin panel to manage users/problems
* [ ] Advanced security sandbox (e.g., seccomp, firejail, docker)

---

## 🧑‍💻 Author

**Juan Israel** – *Computer Engineering Student*

TCC Advisor: *Prof. Suelen*

Institution: *IFMG*

---

## 📜 License

MIT License. See `LICENSE` for more info.
