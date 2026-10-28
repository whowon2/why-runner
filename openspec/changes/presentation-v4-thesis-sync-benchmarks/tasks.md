## 1. Bench infrastructure

- [x] 1.1 Create `bench/` layout, Python venv requirements (matplotlib, Pillow), `bench/README.md` with hardware + tool versions
- [x] 1.2 Script to start/migrate/seed throwaway `whyrunner-bench-db` (port 5444); refuse any non-bench `DATABASE_URL`
- [x] 1.3 Build judge bench image from this worktree's `judge/`

## 2. Judge benchmarks

- [x] 2.1 Concurrency: N=1,2,4,8 × bursts 40/100, mixed languages; throughput, p50/p95; plus `--cpus=1` run
- [x] 2.2 End-to-end stage latency (queue wait, compile, run, write)
- [x] 2.3 Per-language cost (hello world + CPU-bound; compile, run, peak RSS; cold vs warm) as `#[ignore]` bench test
- [x] 2.4 Sandbox overhead: bare vs isolate
- [x] 2.5 Verdict accuracy: AC/WA/TLE/MLE/CE/RE × 6 languages → confusion matrix
- [x] 2.6 Compare-mode re-grade: read-only historical failures (local + Neon read-only) + synthetic perturbations
- [x] 2.7 Structural-constraint false-positive suite (strings/comments)

## 3. Web / AI / CI benchmarks

- [x] 3.1 Plagiarism quality: synthetic corpus, per-level box plot, threshold, precision/recall/ROC
- [x] 3.2 Plagiarism performance: N = 10, 30, 50, 100, 200
- [x] 3.3 AI latency per feature, reference-solution pass rate, fallback rate (≤20 calls/measure, counted)
- [x] 3.4 Standings + gradebook computation time on large synthetic data; submit insert+NOTIFY latency
- [x] 3.5 CI job durations from `gh run list/view`
- [ ] 3.6 `bench/charts.py` → `docs/presentation/charts/`; `bench/results/summary.json`

## 4. Corrections

- [x] 4.1 Fix `AUDITORIA_PRE_DEFESA.md` (no 23-student contest; classroom test 29/10/2026)

## 5. Screenshots

- [x] 5.1 Seed local instance; dev server on `DEV_PORT`
- [x] 5.2 Capture: verdict badges, compare modes/checker editor, plagiarism pair list + side-by-side, gradebook + CSV, `/home`, command palette, notifications, surveys (form, SUS, results), private join approval, JSON import, failed test case, lesson deadlines, other archive features

## 6. Deck v4

- [x] 6.1 `docs/presentation/build_v4.py` from v3 idiom; split dense slides; new feature/diagram/benchmark slides; cronograma 29/10 → análise → defesa
- [x] 6.2 Full speaker notes on every slide; density lint (≤12 body words, ≤3 pills)
- [x] 6.3 Export PDF (LibreOffice container); render and visually check; v1–v3 unchanged

## 7. Thesis

- [x] 7.1 Update `overleaf/main.tex` sections listed in the proposal + Performance Evaluation section from bench results
- [x] 7.2 `refs.bib`: Schleimer/Wilkerson/Aiken 2003 (winnowing), ICPC rules if cited; parity edits in `apps-edu.tex`
- [x] 7.3 Compile with latexmk in TeX Live container; no undefined refs

## 8. Ship

- [ ] 8.1 Commit (no Co-authored-by trailer), open PR, list slides ranked "safest to cut"
