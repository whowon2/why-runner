## Why

The advisor found the v3 deck (16/10) too dense ("massantes"): too much text and too many images per slide. Since v3, eight changes shipped (surveys, `/home`, command-palette hint, CI, gradebook, plagiarism detection, distinct verdicts + checkers, concurrent judge pool) and none of them is in the deck or fully in the thesis. The thesis also has no measured performance data, and `AUDITORIA_PRE_DEFESA.md` claims a 23-student contest that never happened. The first classroom test is on 29/10/2026, so the deck and thesis must be in sync now, with real numbers and an honest evaluation status.

## What Changes

- **Benchmark suite** (`bench/`): reproducible scripts, raw results (CSV/JSON) and charts (`docs/presentation/charts/`) for concurrency, end-to-end latency stages, per-language cost, sandbox overhead, verdict classification accuracy, compare-mode re-grade, plagiarism quality and performance, structural-constraint false positives, AI latency/pass rate/fallback, web computation cost (standings/gradebook), and CI durations. Every write goes to a throwaway local Postgres container; the production Neon DB is read-only (`default_transaction_read_only=on`). Hardware and re-run commands documented in `bench/README.md`.
- **Deck v4**: new `WhyRunner — Apresentação TCC II v4.pptx` + PDF at the repo root, built by `docs/presentation/build_v4.py`. One idea per slide, title = claim, one big screenshot or chart, ≤ ~12 body words, ≤ 3 pills, full speaker notes on every slide. Dense v3 slides split; new slides for every shipped feature since v3, every benchmark chart, verdicts, compare modes, checker protocol, concurrency and plagiarism pipelines. Cronograma: classroom test 29/10 → analysis → defense. v1–v3 untouched.
- **Thesis** (`overleaf/main.tex`, `refs.bib`, small parity edits in `overleaf/apps-edu.tex`): verdicts, output comparison and checkers, concurrency, code similarity detection, gradebook, CI + enum-sync, a Performance Evaluation section with tables/figures from the benchmark suite, updated comparison table, strengths, limitations, future work, and evaluation status (instrument built, classroom test scheduled 29/10/2026, no results yet).
- **Audit correction**: `AUDITORIA_PRE_DEFESA.md` stops claiming a 23-student contest with 50+ submissions.
- No application behavior changes. Benchmarks may add `#[ignore]`d bench tests to `judge/` and bench scripts that import `web/lib` modules; neither changes runtime code paths.

## Capabilities

### New Capabilities
- `benchmark-suite`: reproducible performance/quality measurements whose committed raw results are the single source for every number in the deck and thesis; safety rules for DB writes and AI spend.

### Modified Capabilities
- `presentation-deck`: adds v4 requirements (density rules, slide splits, new feature/benchmark slides, honest classroom-test status, cronograma, reproducibility).
- `dissertation-sync`: the "classroom evaluation" requirement is corrected (no trial has happened); adds requirements for verdicts/comparison, concurrency, similarity detection, gradebook, CI, and a benchmark-backed performance section.

## Impact

- New: `bench/` (scripts, `results/`, README), `docs/presentation/charts/`, `docs/presentation/build_v4.py`, new screenshots, v4 `.pptx`/`.pdf`.
- Edited: `overleaf/main.tex`, `overleaf/refs.bib`, `overleaf/apps-edu.tex`, `AUDITORIA_PRE_DEFESA.md`; possibly `#[ignore]` bench tests in `judge/src/`.
- Tooling: Python venv (matplotlib, Pillow) for charts/deck; Docker for the judge sandbox, a throwaway Postgres, LibreOffice (PDF export) and TeX Live (thesis compile). AI benchmarks spend a small, reported number of API calls.
