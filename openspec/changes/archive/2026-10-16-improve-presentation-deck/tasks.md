## 1. Preserve inputs

- [x] 1.1 Copy the author's attached prints from the session image folder into `docs/presentation/screenshots/`:
  - `validar-publicar.png`
  - `solution-constraints.png`
  - `submissoes-explicar.png`
  - `editor-autosave.png`
  - `placar.png`
- [x] 1.2 Copy v2 `.pptx` to `WhyRunner — Apresentação Parcial TCC II v3.pptx`. Leave v1 and v2 untouched.
- [x] 1.3 Confirm the pilot feedback with the author (recorded in design.md "Confirmed pilot feedback")

## 2. Capture screenshots

- [x] 2.1 Start Postgres + `web` + `judge` locally with seed data. Ensure there is one class with a lesson, two student accounts, and a tournament with submissions.
- [x] 2.2 Capture problem authoring prints (dark, PT-BR, 1600×900):
  - AI narrative generation
  - automatic tags
  - preview
  - AI edge-case review
- [x] 2.3 Capture the problem list with filters open (tags, difficulty, code, own problems) and a search by problem code
- [x] 2.4 Capture tournament prints:
  - creation form showing the private option
  - problem selection by code
  - tournament editor (problem workspace)
- [x] 2.5 Capture lesson prints:
  - a Blockly exercise
  - a Parsons exercise
  - class join-code generation
  - teacher reviewing a student's lesson submission

## 3. Fix existing slides

- [x] 3.1 Title slide: replace `[data]` with `16/10/2026`
- [x] 3.2 Architecture slide: replace the fallback caption with chained boxes Gemini 3.5 Flash → Gemini 3.5 Flash-Lite → Claude Haiku 5.5. Give Haiku a dashed border labelled "se ANTHROPIC_API_KEY", add a "30 s / tentativa" label, and check names against `web/lib/ai-models.ts`.
- [x] 3.3 Split slide 7 into "Validação técnica" (29 tests by category only) and "Validação dos problemas" (`validar-publicar.png` + language select, Gerar com IA, run against all cases, re-validate after edits)
- [x] 3.4 Lesson slide (former 10): keep the constraints content. Optionally swap in `solution-constraints.png`.
- [x] 3.5 Cronograma: remove the date row (`[outubro]`, `[mês]`, `[data]`) and connect steps 1→6 with arrows as a sequence only. Keep the "etapa crítica" callout.

## 4. Add feature slides

- [x] 4.0 Comparison table (slide 4): add a "Portugol + blocos" column (● only for WhyRunner) and mention it in the "Diferencial" line and notes

- [x] 4.1 "Criação de problemas com IA" slide: narrative, auto tags, preview, edge-case review
- [x] 4.2 "Banco de problemas" slide: filters + code search
- [x] 4.3 "Workspace" slide: `editor-autosave.png` (highlighting + "Salvo neste navegador") and `submissoes-explicar.png` (code, copy, Explicar)
- [x] 4.4 "Criar torneio" slide: creation form with private option + problem selection by code
- [x] 4.5 "Torneio em andamento" slide: tournament editor + `placar.png`, with a legend for attempts / minute / ★ / penalty
- [x] 4.6 "Formatos visuais" slide: Blockly + Parsons prints
- [x] 4.7 "Turma e revisão" slide: join code + teacher review print. Merge with 4.6 if the prints fit.
- [x] 4.8 Reorder slides per the design's sequence and renumber the `NN · SEÇÃO` kickers and footers

## 5. Evaluation slides

- [x] 5.1 "Teste piloto informal (Discord, 5 colegas)" slide. Label it informal, with no SUS numbers.
  - Left column: 3 confirmed complaints, each with its fix:
    - no code in tournament attempts → code + copy button (`submissoes-explicar.png`)
    - weak leaderboard → ICPC-style leaderboard (`placar.png`)
    - confusing JSON import → format guide + detailed errors
  - Right column: positive feedback:
    - dark/terminal visual design
    - the "Why"/"Uai" name pun, which carries the platform's goal of explaining *why*
- [x] 5.2 "Avaliação planejada" slide: classroom (tournament + lesson), SUS, and the teacher's view of creating lessons and tournaments, marked as not yet done
- [x] 5.3 Discussion slide: keep "Ainda sem avaliação com alunos" as a limitation

## 6. Notes, export, verify

- [x] 6.1 Update speaker notes for every new or changed slide (~30 s per feature slide)
- [x] 6.2 Export `WhyRunner — Apresentação Parcial TCC II v3.pdf`
- [x] 6.3 Verify against the spec:
  - `pdftotext` finds none of `[data]`, `[mês]`, `[outubro]`
  - "Haiku" is on the architecture slide
  - every feature in the spec list appears as a print
  - constraints appear only on the lesson slide
- [x] 6.4 Render slide images and visually check for overflow and cropped text; `git diff` confirms v1/v2 unchanged
