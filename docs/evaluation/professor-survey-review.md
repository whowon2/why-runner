# Survey review: professor (lesson author), classroom test 2026-10-29

Source: `lesson_author` export (form v1), exported 2026-11-09. **1 response**,
for the lesson "Lista de exercícios 12 - extra 2" (the same lesson as the
student survey in `survey-review.md`), submitted 2026-10-29 19:24 UTC. Raw
CSV is not checked in.

## Who answered

- 1 professor, 10+ years teaching.
- Has used BOCA, beecrowd and run.codes before.

## SUS (System Usability Scale)

**80** (grade A−, above the 68 benchmark and above the students' 72.1).

| Item | Answer | Reading |
|---|---|---|
| sus1 would use frequently | 4 | good |
| sus2 unnecessarily complex (neg.) | 2 | good |
| sus3 easy to use | 4 | good |
| sus4 would need technical support (neg.) | 1 | strong |
| sus5 functions well integrated | 4 | good |
| sus6 inconsistent (neg.) | **3** | weakest; matches the "save works differently on each screen" complaint (P5) |
| sus7 most people learn quickly | 4 | good |
| sus8 cumbersome (neg.) | 2 | good |
| sus9 felt confident | 5 | strong |
| sus10 needed to learn a lot first (neg.) | 1 | strong |

## Specific items (1–5 agreement)

| Item | Answer |
|---|---|
| Creating the class was easy (`classSetup`) | 5 |
| Saves time compared to grading by hand (`timeSaved`) | 5 |
| Would reuse the lists in later classes (`reuse`) | 5 |
| Setting up the list was easy (`listSetup`) | 4 |
| AI help when writing problems was useful (`aiAuthoring`) | 4 |
| Reviewing students' work was easy (`review`) | 4 |
| Answer modes were useful (`answerModes`) | 3 |
| Constraints were useful (`constraints`) | 3 |

Answer modes and constraints got 3: neutral, consistent with the lesson
using plain code only and no constraints.

## Open answers

- **What helped**: "Correção automática dos exercícios".
- **General comment**: "Excelente ferramenta. Parabéns pelo trabalho. Com
  certeza usaria recorrentemente nas aulas das minhas disciplinas de ensino de
  programação. Claro que pode ficar ainda melhor resolvendo os problemas
  listados acima e outros que vão surgindo ao longo do seu uso."
- **What hindered**: 12 items, one task each below. The professor used the
  platform before and during the class (morning of 2026-10-29), so the
  build they saw predates every fix from #81 on.

## Tasks

Status checked against `main` on 2026-11-09.

| # | Feedback (summary) | Status | Fix / where |
|---|---|---|---|
| P1 | Let students test their code and see the output before submitting | **Fixed** (#89, web 1.2.0 / judge 1.1.0) | "Run with custom input": non-graded judge run. Same as student F6. |
| P2 | Limit which languages students may use for a problem/list | **Open** | `lesson_exercise.primaryLanguage` only sets the default; the editor still offers every language. Add an allowed-languages list per exercise (and per contest problem), enforced in the submit/run actions, not only in the UI. M |
| P3 | AI writes English text when authoring problems, even with the site in Portuguese | **Open** | Student AI help passes `locale` (`get-ai-help.ts`), but the authoring prompts don't: `getNarrativePrompt`, `getProblemReviewPrompt`, `getTagSuggestionPrompt` (and reference-solution comments). Pass the request locale and tell the model which language to answer in. S |
| P4 | Any signed-up user can create classes and sees the full interface; students only need the problems their teacher assigned | **Open** | `create-class.ts` has no gate; `user.role` is only `user`/`admin`. Options: a `teacher` role (granted by admin or self-declared at signup) that gates class/lesson creation and hides authoring menus for students; or a simpler "student view" that hides authoring until the user creates something. Needs a design decision. M |
| P5 | Leaving the problem editor without "Salvar rascunho" loses edits with no warning; some screens autosave, others don't, standardize | **Open** | No `beforeunload`/route-leave guard anywhere in `web/` (`grep beforeunload`). Add an unsaved-changes guard to the problem editor (`problems/_components/create.tsx`) and other explicit-save forms; then pick one rule (explicit save + guard, or autosave drafts) and apply it everywhere. Ties to SUS item 6 = 3. S–M |
| P6 | Allow problems created by any user in an activity list | **Fixed** (#81) | `ProblemPicker` searches every published problem plus your own drafts (was: first 50 of your own). |
| P7 | Problem narrative doesn't show when the problem is in a list | **Fixed** (#90, web 1.3.0) | Lesson exercises moved to the workspace shell; `exercise-workspace.tsx` renders `problem.narrative`. |
| P8 | Number of examples shown to students doesn't work, all examples are shown | **Fixed** (#83) | Per-test `visible` flag (new tests hidden by default) plus lesson mode `problem_default` / `show_all` / `hide_all`. |
| P9 | With a browser auto-translate plugin, generic errors appear while coding | **Likely fixed** (#81), verify | Code surfaces, editors and the language selector are `translate="no"`. Still to check: other React-managed text nodes that Google Translate rewrites (classic `removeChild`/`insertBefore` crash). Repro with Chrome translate on a lesson exercise; if it still crashes, mark `<html translate="no">` on workspace routes or wrap dynamic text in elements. S |
| P10 | List a class's students alphabetically | **Open** | `get-class.ts` orders members by `joinedAt`. Sort by name (case/accent-insensitive, `localeCompare` with `pt-BR`) in the member list and gradebook; keep teachers first. XS |
| P11 | Show the problem's statistics in the activity list view too | **Open** | Statistics (`use-problem-statistics`, `workspace/statistics.tsx`) only appear on the problem page. Add a statistics tab to the exercise workspace, scoped to the class (lesson submissions) rather than global. S |
| P12 | Submission results hard to reach with many test cases; paginate test cases, put submission history right under the statement | **Partly fixed** (#88, #90) | Done: latest verdict + pass count in the editor toolbar opens the report (#88); workspace shell has a submissions panel (#90). Open: collapse/paginate the per-test list in `submission-details.tsx` (show failing tests first, collapse passed ones). S |

### Summary by status

- **Fixed (4)**: P1, P6, P7, P8.
- **Partly / likely fixed (2)**: P9 (verify), P12 (test-case list).
- **Open (6)**, by impact: P5 unsaved-changes guard, P3 AI language,
  P4 teacher/student role, P2 allowed languages, P10 sort students,
  P11 stats in lesson.

## Limitations

- One professor, the one who ran the class: no other teacher evaluated
  authoring, so these are anecdotal, not statistics.
- The professor knows the developer, so social desirability is likely in
  the scores. The 12 detailed complaints are the more useful part.
