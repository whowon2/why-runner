## Why

The advisor's review of the WSI paper (`overleaf/main.tex`, pt-BR twin `main-ptbr.tex`) says the text "virou um relatório técnico": it describes WhyRunner's architecture and benchmarks in depth but never states a research question, its methodology is a development history, and its related work omits the best-known judges and the existing AI-feedback tools. The advisor submits the text on 2026-11-26, so the paper must be reframed tonight as a scientific paper about teaching programming, within the existing 14-page limit.

## What Changes

- New teaching-focused title (EN + pt-BR); abstract/resumo rewritten around the research question and the classroom findings.
- Introduction states the problem, an explicit research question, and a list of real contributions.
- Methodology rewritten as the research design (approach, setting, participants, instruments, analysis). Development history (queue/DB/sandbox migrations, MVP with colleagues, security review) moves to a short implementation subsection.
- Related work expanded: well-known judges (beecrowd, DOMjudge, CodeRunner, alongside BOCA/Run.codes/Ataux/GOJ) and AI feedback in programming education (CodeHelp/Liffiton et al. 2023, CodeAid, surveys). Novelty framed honestly: AI hints are not new; the contribution is their integration into a classroom judge with hidden-test confidentiality and teacher-curated lessons. Table 1 revised accordingly. Only verified references are added to `refs.bib`.
- **PRINCIPAL**: technical detail cut sharply (sandbox limits, worker pool internals, CI, CSV quoting, benchmark tables) — kept only as a compact technical-validation summary that supports the teaching claims.
- Optional, conditional on read-only production DB access tonight: analysis of system logs around AI hint requests (submissions/verdicts before vs after a hint). If the data is unavailable or pruned, the paper says nothing about it.
- Ethics/consent text left exactly as it is.
- `main.tex` and `main-ptbr.tex` stay structurally identical; any new chart gets a pt version in `overleaf/figures/pt/`.

## Capabilities

### New Capabilities
- `paper-scientific-framing`: requirements for the thesis paper's framing as a teaching-focused scientific paper (research question, contributions, research-design methodology, related work coverage, limited technical detail, honest data and citations, EN/pt-BR parity, page limit).

### Modified Capabilities
<!-- none: dissertation-sync describes an older state of the paper and is not touched by this change -->

## Impact

- `overleaf/main.tex`, `overleaf/main-ptbr.tex`, `overleaf/refs.bib`, possibly `overleaf/figures/` and `overleaf/figures/pt/` (new log chart only if data exists).
- No application code, DB schema, or judge changes. Production DB touched only with read-only `SELECT` queries, if at all.
