## 1. Source-of-truth review

- [x] 1.1 Re-read `openspec/specs/learning-roadmap`, `lesson-track-authoring`, `lesson-grading`, `lesson-requirements` for exact Classes/Lessons/Exercises/Assignments behavior
- [x] 1.2 Re-read `openspec/specs/solution-constraints`, `problem-io-validation`, `ai-problem-review`, `problem-narrative` for exact authoring/AI/constraint behavior
- [x] 1.3 Re-read `openspec/specs/notifications`, `notification-preferences` for the notifications capability
- [x] 1.4 Skim commits `ceaac3e`..`6fa7f34` for any user-facing behavior not captured in the specs above (e.g. assignment resubmit/review confirm flow, duplicate-problem-in-lesson prevention)

## 2. `overleaf/main.tex` — System Design

- [x] 2.1 In §Overview, add one sentence noting WhyRunner now also supports professor-curated Classes/Lessons/Exercises alongside contests
- [x] 2.2 Add a new §System Design subsection (or expand §Submission Lifecycle) describing the Class → Lesson → Exercise → Assignment model: professor assembles/orders lessons, assigns to a class, students work through exercises, assignment resubmit/review flow
- [x] 2.3 Rename/expand §Feedback Enhancement via AI to cover AI-drafted reference solutions, AI problem review, and AI-generated narrative flavor text as sibling capabilities to hint feedback, each with its input/output
- [x] 2.4 Add pre-publish I/O validation description (reference solution vs. judge sandbox gate before publish; I/O edits invalidate a prior pass) to System Design
- [x] 2.5 Add solution-constraint enforcement description (forbidden constructs / required-algorithm checks) to System Design
- [x] 2.6 Update §Submission Lifecycle or add a note that assignment scores are derived from per-exercise judge results, not one aggregate verdict
- [x] 2.7 Add a brief notifications-system description to System Design

## 3. `overleaf/main.tex` — Related Work, Discussion, Future Work

- [x] 3.1 Update §Comparative Analysis to reflect professor-curated learning paths / solution-constraint enforcement as differentiators
- [x] 3.2 Update §Limitations: add the "implemented but not yet classroom-validated" caveat for roadmap/authoring/grading/notifications capabilities
- [x] 3.3 Update §Future Work: remove "roadmap repurposed as professor-curated track" and "solution-constraint enforcement" (now shipped); keep language-support expansion and quantitative evaluation, and add classroom validation of the new capabilities as a future-work item
- [x] 3.4 Re-read §Conclusion and adjust if it undersells the current scope

## 4. `overleaf/apps-edu.tex`

- [x] 4.1 Update abstract/resumo if it undersells the current scope (optional, only if the added capabilities materially change the pitch)
- [x] 4.2 Update §4 Diferenciais e Potenciais de Inovação with the same additions as main.tex §Comparative Analysis
- [x] 4.3 Update §6 Aspectos Tecnológicos and Arquitetura resumida to mention Classes/Lessons/Exercises, AI-assisted authoring, pre-publish validation, solution constraints, per-exercise grading, notifications
- [x] 4.4 Review §Nível TRL — confirm with the author whether TRL 7 still applies only to the contest-validated scope, and note that explicitly if so
- [x] 4.5 Update §8 Considerações Finais if needed for consistency with the rest of the document

## 5. Consistency pass

- [x] 5.1 Cross-check that every capability added to `main.tex` has a matching mention in `apps-edu.tex` and vice versa
- [x] 5.2 Confirm no claim in either document implies classroom validation of features that were only contest-tested
- [x] 5.3 Spot-check LaTeX compiles (or at minimum, no unbalanced braces/environments introduced)
