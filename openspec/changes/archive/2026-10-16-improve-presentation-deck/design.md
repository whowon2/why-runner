## Context

The v2 deck (13 slides, PPTX + PDF at repo root) was rebuilt on 2026-10-15 with a terminal/dark visual style that matches the app's "linux rice" design system. Content gaps the author found:
- the date is still a placeholder;
- the Claude Haiku fallback appears only in a caption;
- slide 7 mixes three different kinds of validation;
- most shipped features are described rather than shown.

Slide 10 ("Aula") already covers solution constraints and the lesson formats (code, blocks, Parsons) in text. The presentation is on 2026-10-16.

The author attached prints of problem validation, the constraints dialog, the submission list (copy + Explicar), the editor with autosave, and the leaderboard. They currently live in the session's `/tmp` image folder and must be copied into the repo before they disappear.

## Goals / Non-Goals

**Goals:**
- Produce a v3 deck that follows the `presentation-deck` spec.
- Make prints, not text, the main content of feature slides.
- Keep v2's visual language: dark background, monospace headings, `NN · SEÇÃO` kicker, green accent.

**Non-Goals:**
- Any change to `web/` or `judge/`.
- Running the real classroom study.
- Changing the LaTeX article in `overleaf/`.

## Decisions

- **Build v3 by editing a copy of v2 with the `anthropic-skills:pptx` workflow, not rebuilding from scratch.** v2's layout and notes are already good, and the change is mostly inserting, splitting and editing slides. Rebuilding risks drifting from the approved style.
- **Proposed slide order (~21 slides):**
  1. Title, dated 16/10/2026
  2. Introduction
  3. Problem and objectives
  4. Related work
  5. Stages
  6. Architecture, with the explicit AI chain
  7. Validação técnica
  8. Validação dos problemas
  9. Three submission contexts
  10. Authoring with AI: narrative, auto tags, preview, AI edge-case review
  11. Problem list: filters and code search
  12. Workspace: editor with highlighting and autosave, submissions with copy and Explicar
  13. Tournament creation: private option, problem selection by code
  14. Tournament in progress: editor and leaderboard
  15. AI in the tournament (existing)
  16. Aula (existing slide 10, constraints kept)
  17. Formats: Blockly and Parsons prints
  18. Class and review: join code, teacher reviewing a lesson submission
  19. Informal Discord pilot
  20. Planned evaluation
  21. Discussion
  22. Cronograma
  23. References

  Slides 17 and 18 may merge if the prints fit. The order follows how a professor would use the platform: author problems → run tournaments → teach lessons.
- **Draw the AI chain as three boxes with arrows, plus a "30 s / tentativa" label.** Haiku gets a dashed border with the label "se ANTHROPIC_API_KEY". Rejected: a caption only, which is what the author flagged as not showing Haiku.
- **Build the pilot slide from candidate fixes, but publish only feedback the author confirms.** Negative candidates come from archived changes motivated by user-visible problems:
  - contest list not refreshing after delete, and drafts flipping status (`2026-07-23-fix-contest-list-refresh-and-draft-status`)
  - unreadable secondary buttons (`fix-button-text-contrast`)
  - followers list and contest problems going stale (`fix-query-invalidations`)
  - cramped contest workspace (`widen-contest-problem-workspace`)
  - no code shown in contest submissions (`show-code-in-contest-submissions`)
  - guests could not switch language (`allow-guest-language-switch`)
  - cryptic JSON import errors (`improve-problem-import`)
  - leaderboard without penalty or tie-breaks (`improve-contest-leaderboard`)
  - profile showing fake counts (`fix-user-profile-page`)

  Positive feedback is to be supplied by the author (e.g. on AI hints, speed of verdicts). Rejected alternative: inventing quotes or numbers and presenting them as a user evaluation. That would be fabricated research data in a thesis defense. The slide is framed as "teste piloto informal: o que mudou por causa dele".
- **Take screenshots with a scripted browser against a local seeded instance.** Use 1600×900 viewport, dark theme and PT-BR locale. Save PNGs to `docs/presentation/screenshots/<NN>-<feature>.png`. The author's attached prints are reused where they already match.

## Risks / Trade-offs

- [Time: the presentation is today] → Prioritize the date, architecture chain, validation split and the slides that reuse the attached prints. Optional slides (17/18 merge, extra crops) come last.
- [Local seed may lack data for the leaderboard, lessons or reviews] → Reuse the attached leaderboard print. Seed one class/lesson with two student accounts if missing.
- [Slide count grows and the talk runs over time] → Feature slides are print-heavy with ≤2 lines of text. Speaker notes give a ~30 s budget per feature slide.
- [Pilot feedback misremembered] → Explicit author confirmation step before the slide is finalized.

## Confirmed pilot feedback (author, 2026-10-16)

Negative feedback → shipped fix:
- **No code in tournament attempts.** Players couldn't tell which code produced which verdict → `show-code-in-contest-submissions` (code + copy button on each attempt).
- **Weak leaderboard.** It showed only medals: no time or penalty, arbitrary tie-breaks, no live refresh → `improve-contest-leaderboard` (attempts, minute, ★ first solve, ICPC-style penalty, live refresh).
- **Confusing JSON import.** There was no format hint and errors like "Invalid format: Required" → `improve-problem-import` (format guide, errors with field path and problem index).

Positive feedback:
- Liked the visual design and the terminal-style dark theme.
- Liked the name pun: "Why" read as the Minas Gerais "Uai". The authors are mineiros, and the goal of the platform is telling the student *why* something happened.

Other candidates from the design list are excluded because the author does not recall them being reported.

## Cronograma

Defense date unknown, so the cronograma is a sequence-only timeline: v2's six numbered steps joined by arrows, with the date row removed.

1. Atualizar o texto
2. Preparar avaliação
3. Aplicar com uma turma
4. Analisar os dados
5. Revisão final
6. Defesa

v2's "etapa crítica" callout on step 3 is kept.

## Open Questions

None.
