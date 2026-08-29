## Context

`overleaf/main.tex` (SBC-format thesis article) and `overleaf/apps-edu.tex` (software-registration white paper) were written against the codebase as of roughly PR #46 (`feat/prepublish-io-validation`). Six PRs of product work have landed since (`ceaac3e`..`6fa7f34`): the roadmap pivot to professor-curated Classes/Lessons/Exercises, AI-assisted authoring (reference-solution drafting, problem review, narrative flavor text), solution-constraint enforcement, per-exercise grading, notifications, and assignment resubmit/review UX. The dissertation text was never updated to reflect any of it — confirmed by `git log --follow -- overleaf/main.tex` showing only a mechanical monorepo-move commit touching the file.

Stakeholder: the author (juaniwk3), defending this as their TCC. Constraint: both `.tex` files must stay internally consistent (English thesis vs. Portuguese white paper) and keep compiling under the SBC template.

## Goals / Non-Goals

**Goals:**
- Bring `overleaf/main.tex` System Design, Limitations, and Future Work sections up to date with what's actually shipped.
- Bring `overleaf/apps-edu.tex` (Diferenciais, Aspectos Tecnológicos, Arquitetura, Considerações Finais) up to date in Portuguese, consistent with the English version.
- Reframe the product narrative from "contest judge with AI hints" to "contest judge + professor-authored Classes/Lessons/Exercises platform with AI-assisted authoring and grading," without overstating validation (the classroom trial in Evaluation/Results predates the pivot and only exercised the contest path — that must stay scoped honestly, not retold as if it validated the new roadmap features).
- Keep new content anchored to the `openspec/specs/*` capability docs and commit history as source of truth, not speculation.

**Non-Goals:**
- No new user study or evaluation of the roadmap/lessons features — Evaluation/Results sections describe the one classroom trial that happened; they are not being rewritten to claim more than that.
- No application code, schema, or spec changes.
- No new figures required unless the author wants one; a textual description of the Class → Lesson → Exercise → Assignment flow is sufficient for this change.

## Decisions

- **Scope the Evaluation/Results sections untouched, but add a caveat.** The classroom contest predates the pivot and only tested contest + hint-feedback. Rather than silently leaving readers to assume it covered the new features, add one sentence to Limitations noting the roadmap/authoring capabilities are implemented but not yet classroom-validated. Alternative considered: rewrite Results to sound broader — rejected, would misrepresent what was actually tested.
- **Treat contest and roadmap as two coexisting capabilities, not a replacement.** Code confirms `contests.ts` schema and `app/[locale]/contests` still exist alongside `classes.ts`/`lessons.ts`. Dissertation should describe WhyRunner as now supporting both a contest mode and a professor-curated learning-roadmap mode, not frame the roadmap as having replaced contests.
- **Fold AI-drafted problems, AI review, and narrative flavor text into the existing "Feedback Enhancement via AI" section, renamed/expanded to "AI-Assisted Authoring and Feedback."** These are the same Gemini integration pattern (structured prompt, student/professor-facing) documented next to the existing hint-feedback subsection, rather than a new top-level section — keeps the paper's structure stable.
- **Update the Comparative Analysis table** (§Comparative Analysis, main.tex) with a row or note on professor-curated learning paths / solution-constraint enforcement, since that's now a differentiator versus Ataux/GOJ/Run Codes/BOCA alongside AI feedback.
- **Remove shipped items from Future Work**, specifically "Roadmap repurposed as professor-curated track" framing is gone (it's done); keep language-support expansion and quantitative evaluation (SUS/PSSUQ) as still-open since those remain unimplemented per `judge/CLAUDE.md` and the memory backlog.

## Risks / Trade-offs

- [Overclaiming maturity of unvalidated features] → Mitigation: explicit "implemented but not yet classroom-validated" caveat in Limitations; Future Work keeps a quantitative-evaluation item that now also covers the roadmap features.
- [Scope creep into rewriting Evaluation with fabricated new data] → Mitigation: non-goal stated above; only descriptive/architecture sections change.
- [English/Portuguese drift between the two files] → Mitigation: tasks.md sequences apps-edu.tex edits directly after the matching main.tex section so they're written from the same source facts.

## Migration Plan

Not applicable (documentation-only, no deployment). Edits are applied directly to `overleaf/main.tex` and `overleaf/apps-edu.tex` in the working tree; no build/release step beyond the author recompiling the LaTeX when ready.

## Open Questions

- Does the author want a new figure/diagram for the Class → Lesson → Exercise → Assignment flow, or is prose sufficient? (Defaulting to prose for this change; a figure can be a follow-up.)
- Should the TRL rating in `apps-edu.tex` (currently TRL 7, justified solely by the contest trial) be revisited given the untested roadmap features? (Defaulting to leaving TRL as-is since it's scoped to the validated contest capability, but flagging for the author to confirm.)
