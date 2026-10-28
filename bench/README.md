# WhyRunner benchmarks

Reproducible measurements behind every number in deck v4
(`WhyRunner — Apresentação TCC II v4.pptx`) and in the *Performance
Evaluation* section of `overleaf/main.tex`. Raw results live in
`bench/results/`; `bench/charts.py` turns them into the charts in
`docs/presentation/charts/` (dark, Portuguese, for the deck) and
`docs/presentation/charts/light/` (light, English, for the thesis), and into
`bench/results/summary.json`, which holds every headline number quoted.

Measured on 2026-10-28.

## Hardware and software

| | |
|---|---|
| CPU | AMD Ryzen 5 5600, 6 cores / 12 threads |
| RAM | 32 GB |
| OS | CachyOS Linux, kernel 7.2.11 |
| Docker | 29.9.2 |
| Judge image | `judge/Dockerfile` of this branch (Debian bookworm): isolate 2.7, gcc/g++ 12.2, rustc 1.63, OpenJDK 21.0.12, Python 3.11.2, Portugol console 2.7.5 |
| Bench DB | `postgres:16` in a throwaway container (`bench/lib/bench-db.sh`) |
| Web side | Bun 1.3.12 running the app's own `web/lib` modules |
| Scripts | Python 3.14 venv (`bench/.venv`: matplotlib, numpy, psycopg, playwright) |

This is a desktop, not the production machine. Production runs the judge on
a Fly.io `shared-cpu-1x` VM (one vCPU), where `JUDGE_CONCURRENCY` resolves to
1; the `-1cpu` concurrency runs reproduce that case.

## Safety

- Anything that inserts goes to the throwaway `whyrunner-bench-db` container
  (port 5444, tmpfs storage). `bench/judge/common.py` refuses any other URL.
- The production database (the commented URL in `web/.env`) and the local
  dev database are only read, in sessions with
  `default_transaction_read_only=on` (`export_failures.py`,
  `export_hint_cases.py`). No submission row is updated.
- AI: 60 logical calls in total (10 per feature, 20 for reference solutions),
  104 provider attempts including fallbacks; all counted in
  `results/ai_calls.csv`.

## Setup

```sh
python3 -m venv bench/.venv
bench/.venv/bin/pip install matplotlib numpy pillow psycopg[binary] playwright
docker build -t judge:bench -f judge/Dockerfile judge   # needs judge/portugol jar + lib (gitignored)
bench/lib/bench-db.sh up                                # throwaway Postgres + web migrations
bench/.venv/bin/python bench/judge/cases.py             # case files for the Rust benches
```

The in-process judge benches are `#[ignore]`d tests in `judge/src/bench.rs`,
run inside a judge image that also has a Rust toolchain (see
`judge/CLAUDE.md`; `RUST_IMAGE`, default `judge:concurrency-rust`) by
`bench/judge/run-rust-bench.sh <test> <cases> <out>`.

## Benchmarks

| # | What | Command | Raw output |
|---|---|---|---|
| 1 | Concurrency: N = 1, 2, 4, 8 workers × bursts of 40 and 100 mixed-language submissions (6 languages round-robin, 5 tests each), plus N = 1, 4 on 1 CPU | `bench/.venv/bin/python bench/judge/concurrency.py` | `concurrency.csv`, `concurrency.json` |
| 2 | End-to-end stages for one submission on an idle judge (insert + NOTIFY → claim → result), 8 reps × 6 languages | `bench/.venv/bin/python bench/judge/e2e.py` | `e2e.csv` |
| 3 | Per-language compile time, run time, peak RSS (hello world and a 10⁷-step loop), 6 reps, rep 0 = cold | `bench/judge/run-rust-bench.sh lang_cost_bench programs lang_cost -e BENCH_REPS=6` | `lang_cost.csv` |
| 4 | Sandbox overhead: same program bare vs through `runner::execute` (fresh isolate box), plus empty box lifecycle | `bench/judge/run-rust-bench.sh sandbox_overhead_bench programs sandbox_overhead -e BENCH_REPS=6` | `sandbox_overhead.csv` |
| 5 | Verdict accuracy: 2 programs × 6 intended verdicts × 6 languages through the real `grade()` | `bench/judge/run-rust-bench.sh verdict_accuracy_bench verdicts verdicts` | `verdicts.csv` |
| 6 | Compare modes: historical output mismatches (read-only) + synthetic formatting variants of `problems.json` outputs, re-graded with `compare::matches` | `bench/judge/export_failures.py`, `bench/judge/perturb.py`, then `run-rust-bench.sh compare_regrade_bench regrade regrade_eps1e-6 -e BENCH_EPSILON=1e-6` (and `1e-3`) | `regrade_*.csv`, `regrade_sources.json` |
| 7 | Plagiarism quality: 36 hand-written solutions (4 problems × Python/C/Java × 3 authors) + 6 obfuscation levels each; pairwise and class-report mode | `bench/.venv/bin/python bench/plagiarism/corpus.py`, then `cd web && bun ../bench/web/similarity-quality.ts` | `plagiarism_quality.csv` |
| 8 | Plagiarism performance: report time for N = 10…300 students | `cd web && bun ../bench/web/similarity-perf.ts` | `plagiarism_perf.csv` |
| 9 | Structural-constraint checker: 30 hand-labelled samples incl. tokens in strings/comments | `bench/judge/run-rust-bench.sh constraint_accuracy_bench constraints constraints` | `constraints.csv` |
| 10 | AI: latency per feature, fallback rate, reference-solution pass rate (graded by the real judge) | `bench/.venv/bin/python bench/ai/export_hint_cases.py`; `cd web && bun --tsconfig-override ./tsconfig.json ../bench/ai/ai-bench.ts`; `bench/.venv/bin/python bench/ai/grade-reference.py` | `ai_calls.csv`, `ai_reference_grading.csv` |
| 11 | Web: contest standings and gradebook + CSV computation for synthetic classes up to 1000 students | `cd web && bun ../bench/web/standings-gradebook.ts` | `web_compute.csv` |
| 12 | CI: per-job durations of every GitHub Actions run | `bench/.venv/bin/python bench/ci/ci_durations.py` | `ci_jobs.csv` |
| – | Test counts (`cargo test -- --list`, `bun test lib`) | by hand | `tests.json` |

Then `bench/.venv/bin/python bench/charts.py`.

## Method notes and caveats

- **Stage timestamps (1, 2)** come from a bench-only trigger the bench DB adds
  to `submission` (`bench_inserted_at/claimed_at/finished_at`); the app schema
  is not changed. Queue = claimed − inserted; judging = finished − claimed.
  The compile/run split inside "judging" in benchmark 2 is taken from
  benchmark 3's medians, the remainder is "DB + rest".
- **Burst 100, N = 1** overlapped with a single-threaded Bun process for a
  few seconds (12 threads available); the other runs had the machine to
  themselves.
- **Compile flags**: the judge compiles C/C++/Rust without optimization
  flags (`gcc -o program`, `rustc script.rs`), so CPU-bound runs measure
  unoptimized code. That is what students get.
- **Portugol** runs its console jar, which compiles the generated Java on
  every run: ≈1.3 s per test case even for hello world, so 5 tests ≈ 7 s.
- **Verdicts (5)**: the Portugol console prints compile/runtime errors to
  stdout and exits 0, so the judge grades those as WRONG_ANSWER. Python has
  no compile step, so a syntax error is a RUNTIME_ERROR. C's MLE program
  that writes through a failed `malloc` crashes with SIGSEGV and is graded as
  RUNTIME_ERROR (the RLIMIT_AS heuristic, see `judge/CLAUDE.md`).
- **Compare re-grade (6)**: only 16 historical output mismatches exist (14 in
  the local dev DB, 2 in production); all are real wrong answers. The
  synthetic set shows what each mode accepts; its labels say which variants
  are correct answers.
- **Plagiarism (7)**: obfuscations are automatic (`corpus.py`), so they are
  systematic, not adversarial. "Pair" mode compares two submissions alone
  (no boilerplate filter, which needs ≥ 4 submissions); "class" mode runs
  the report over all 21 submissions of a problem + language, as a teacher
  would.
- **AI (10)**: latency includes failed attempts before a fallback answered;
  the Gemini Flash key hit its quota (HTTP 429) during the run, which is why
  most calls fell through. Both C reference solutions that failed came from
  Claude Haiku, which prefixed prose to the code (they did not compile).
- **Web (11)**: pure computation only (the same functions the server
  actions call after their DB queries); DB time is not included.
