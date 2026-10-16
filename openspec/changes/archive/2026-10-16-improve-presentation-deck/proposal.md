## Why

The TCC II partial-presentation deck (`WhyRunner — Apresentação Parcial TCC II v2.pptx`) undersells the platform: most shipped features (AI narrative, auto tags, AI edge-case review, contest creation/privacy, Blockly/Parsons screens, lesson review, class join codes, problem filters, submission list with copy + "Explicar", editor autosave, leaderboard) never appear, and the few that do are described in text instead of shown. (Solution constraints are the exception: slide 10 already covers them.) The date is still a `[data]` placeholder, the architecture diagram buries the Claude Haiku fallback in a caption, and the "Avaliação" slide mixes judge tests, problem I/O validation and the (unrun) user study as if they were one thing. The presentation is on 2026-10-16, so it needs a v3 now.

## What Changes

- New deck `WhyRunner — Apresentação Parcial TCC II v3.pptx` (+ exported PDF), built from v2; v1 and v2 stay untouched.
- Title slide date set to **16/10/2026**; cronograma becomes a sequence-only timeline (step → next step → … → Defesa) with no months or dates; the `[outubro]`, `[mês]` and `[data]` placeholders are removed.
- Architecture slide: AI provider chain drawn as an explicit chain — Gemini 3.5 Flash → Gemini 3.5 Flash-Lite → Claude Haiku 5.5 (only when `ANTHROPIC_API_KEY` set), 30 s timeout per attempt — matching `web/lib/ai-models.ts` and the `ai-provider-fallback` spec.
- Split current "Avaliação" slide into separate slides:
  - **Validação técnica** — the 29 judge tests by category.
  - **Validação dos problemas** — dedicated slide with the "Validar antes de publicar" screenshot: creator picks a language, can "Gerar com IA" a reference solution, runs it against all test cases; editing tests re-blocks publishing.
  - **Teste piloto informal (Discord)** — 5 colleagues on the author's Discord server; feedback (negative and positive) mapped to the archived OpenSpec changes that addressed it (e.g. contest list not refreshing, unreadable buttons, narrow contest workspace, no code in contest submissions, guest language switch, opaque JSON import errors, weak leaderboard). Clearly labelled informal/pilot, not the planned study.
  - **Avaliação planejada** — still states that the classroom study (turma real, SUS, teacher's view of building lessons and tournaments) has not been run yet.
- New screenshot-driven feature slides (real app prints, not text):
  - Problem authoring: AI narrative generation, automatic tag selection, problem preview, AI review for missing edge cases.
  - Problem list: filters by tags, difficulty, code, "meus problemas"; search by problem code.
  - Tournament: creation, private tournament, problem selection by code, tournament editor, leaderboard (attempts, minute, ★ first solve, penalty).
  - Workspace/submissions: syntax-highlighted editor with browser autosave ("Salvo neste navegador às …"), submission list with expandable code, copy button and AI "Explicar" button.
  - Lessons/classes: Blockly and Parsons formats, teacher review of student lesson submissions, class join-code generation.
- Slide 10 ("Aula") already covers solution constraints (loop-nesting limit, forbidden constructs, AI-checked required algorithm) and stays; at most its constraints image is swapped for the "Solution constraints" dialog print. No new constraints slide.
- Screenshots captured from a seeded local instance and stored in-repo so the deck can be rebuilt.

## Capabilities

### New Capabilities
- `presentation-deck`: content and accuracy requirements for the TCC presentation deck — date, architecture/AI-chain accuracy, separation of validation slides, honest labelling of the informal pilot vs. the planned classroom study, and screenshot coverage of shipped features.

### Modified Capabilities
<!-- none: no application behavior changes -->

## Impact

- New files at repo root: `WhyRunner — Apresentação Parcial TCC II v3.pptx`, `… v3.pdf`; screenshot assets under `docs/presentation/screenshots/`.
- No changes to `web/` or `judge/` code. Needs a local `web` + `judge` + Postgres run with seed data to take screenshots.
- Speaker notes updated to match new slide order; slide count grows from 13 to roughly 20–22.
