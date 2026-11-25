## Context

`main.tex` (13 pages after PR #119, WSI limit 14 incl. references) is organised as Intro → Methodology (development history) → Related Work → System Design (≈4 pages of architecture) → Performance Evaluation (≈2.5 pages of benchmarks) → Classroom Evaluation → Discussion → Conclusion. `main-ptbr.tex` mirrors it. The classroom test (2026-10-29, 30 first-year technical high-school students, one lesson, two Python problems, SUS 72.1) is the only empirical evidence about teaching. Deadline: advisor submits 2026-11-26; a better version may replace it by Friday.

## Goals / Non-Goals

**Goals:**
- Reader can name the research question and contributions after the Introduction.
- Methodology describes how the research was conducted, not how the software was built.
- System description is explained in terms of pedagogical goals; technical numbers survive only where they support a teaching claim (e.g., verdict accuracy → trustworthy feedback).
- Related work positions WhyRunner against beecrowd, DOMjudge, CodeRunner, BOCA, Run.codes, Ataux, GOJ and LLM tutors (CodeHelp, CodeAid).
- ≤14 pages, both languages, compiles in `texlive/texlive`.

**Non-Goals:**
- New experiments, new claims about learning gains, or results beyond `sec:evaluation-status`.
- Changing the ethics/consent wording.
- Updating `apps-edu.tex`, slides, or the banner.

## Decisions

- **Research design framing: design-based research / design science** (build an artifact for an identified educational problem, evaluate it in a real class). Alternative "case study" alone undersells the artifact; "experiment" overclaims (no control group).
- **Research question**: one main RQ about how an online judge can support introductory programming teaching and how novices perceive it; sub-questions on perceived usability and perceived usefulness of feedback/AI hints (answered by SUS, Likert, open answers) and, only if data exists, on hint use from logs.
- **Technical cut**: System Design shrinks to "Pedagogical design" (features ↔ goals) + one short architecture/implementation subsection that also receives the development history. Performance Evaluation shrinks to a ≈half-page "Technical validation" paragraph; the concurrency and per-language tables, verdict confusion figure and similarity figure are removed (data stays in `bench/`, cited as the reproducible suite). Pipeline TikZ figure kept or simplified (it shows the feedback loop).
- **Table 1**: rows rewritten around pedagogical dimensions (feedback beyond verdict, AI hints, teacher-curated lists/gradebook, visual answer modes, hidden-test confidentiality, open source / self-hostable, LMS integration). Cells filled only from cited sources; unknown → "n/r".
- **References**: add only entries whose existence and metadata are verified online (DOI/official page); `liffiton2023codehelp`, `kazemitabaar2024codeaid`, `keuning2018systematic`, `wasik2018survey`, `denny2024computing`, `hattie2007power` already exist in `refs.bib` and are reused.
- **Log analysis**: hint requests live only in `ai_usage(user_id, feature, created_at)` with opportunistic pruning of rows >24 h, and are not linked to a submission. Analysis joins by user and time window against `submissions`. Only run if the user provides read-only access and rows from 2026-10-29 survive.

## Risks / Trade-offs

- [Page limit overflow after expanding related work] → cut technical sections first; compile and count pages after each section.
- [Fabricated citation metadata] → verify each new entry via web; drop any that can't be verified.
- [ai_usage rows pruned] → report to user, omit analysis; no estimated numbers.
- [EN/pt drift under time pressure] → rewrite EN first per section, then translate the same section immediately.
- [Ethics] → wording untouched; any added limitation sentence only with user approval.

## Open Questions

- Final title and outline (user confirmation before the big rewrite).
- Read-only production DB access route.
