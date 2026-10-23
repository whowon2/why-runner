## Context

WhyRunner has been used in one real contest (23 students, 6 problems) but has no satisfaction or usability data, which the thesis lists as future work (SUS/PSSUQ). Respondents are IFMG professors and students who already have WhyRunner accounts. claude.ai artifacts and external form tools were ruled out: outside respondents can't write to artifact storage, and an external form can't confirm the respondent actually used the contest or lesson they're rating.

Relevant existing data:
- `contest.createdBy`, `contest.status`, `contest.endDate`; `userOnContest.joinStatus`; `submission.contestId`.
- `lesson.createdBy`, `lesson.isPublished`, `exercise.lessonId`; `lessonSubmission (userId, lessonId)` = "student submitted the list".
- No admin role exists in `user`.

## Goals / Non-Goals

**Goals:**
- Four questionnaires bound to a real contest or lesson, answerable only by people who used it.
- Standard SUS so the score is comparable with the literature, plus WhyRunner-specific items.
- Results and an anonymized CSV that can go straight into the thesis.

**Non-Goals:**
- Showing professors their students' answers.
- A generic survey builder or editing questionnaires from the UI.
- Email/notification reminders (the hub and CTA cards are enough for one classroom run).
- PSSUQ (SUS only; keeps forms short).

## Decisions

### Questionnaires live in code, not the DB
`web/lib/surveys/forms.ts` exports one definition per form: `version`, profile questions, `sus: true`, feature items (`{ key, optional }`), open questions. Text lives in `messages/*.json` under `Surveys.<form>.<key>` (br authoritative). The same definition generates the zod answer schema and drives the page and results.
*Alternative:* DB-defined questions. Rejected: four fixed forms, no editor needed, and versioning in code is reviewable in git.

### One table, two nullable FKs
`survey_response`: `id uuid`, `userId → user (cascade)`, `form survey_form`, `formVersion int`, `contestId → contest (set null)`, `lessonId → lesson (set null)`, `entityName text` (snapshot), `answers jsonb`, `susScore real`, `consentedAt timestamp`, `createdAt`. Partial unique indexes `(userId, form, contestId) WHERE contestId IS NOT NULL` and `(userId, form, lessonId) WHERE lessonId IS NOT NULL` enforce one response; a check constraint ensures contest forms don't set `lessonId` and vice versa.
`set null` + `entityName` keeps research data if a contest/lesson is later deleted.
*Alternative:* a polymorphic `entityId` without FKs. Rejected: loses referential integrity on joins for the results filter.

### Eligibility as one server-only module
`web/lib/surveys/eligibility.ts` (`import "server-only"`) exposes `checkEligibility(userId, form, entityId)` and `listEligible(userId)`. Both the page loader and `submitSurveyResponse` call it, so a direct POST can't skip it. The unique index is the final guard against double submit (catch the unique-violation and return "already answered").

### SUS computed server-side
`lib/surveys/sus.ts` is a pure function with a `bun test` unit test (all-3 → 50, all-best → 100, all-worst → 0). Adjective bands (Bangor, Kortum & Miller 2009): ≤25 "Pior imaginável", <51 "Ruim", 51–68 "OK", 68–80.3 "Bom", 80.3–84 "Excelente", >84 "Melhor imaginável".

### Researcher gate via env var
`SURVEY_ADMIN_EMAILS` (optional, comma-separated) in `env.ts`; `lib/surveys/admin.ts` `isSurveyAdmin(user)`. Non-admins get `notFound()`.
*Alternative:* add a `role` column to `user`. Rejected: broader change for a single researcher.

### Results computed in SQL + TS, CSV built server-side
The results action loads that form's responses (optionally filtered) and aggregates in TS (small n). CSV export is a route handler `app/api/surveys/export/route.ts` (outside the locale middleware, next to `/api/auth`) that checks the admin gate and returns `text/csv`; downloads don't fit server actions. CSV columns follow the form definition order.

### Routes and entry points
- `/surveys` — hub (pending / answered), using `creating-a-page` header conventions.
- `/surveys/[form]/[entityId]` — the questionnaire (React Hook Form + zod from the definition), one scrolling page with sections, Likert rendered as radio groups.
- `/surveys/results` — researcher view.
- `SurveyCta` component on the contest page (eligible, unanswered, after `endDate`) and lesson page (student after `lessonSubmission`; author once any student submitted). Dismiss stored in `sessionStorage`.
- React Query hooks in `hooks/use-surveys.tsx`; the submit mutation invalidates the hub list and CTA queries.

## Questionnaire content (v1, pt-BR)

Scale for all Likert items: 1 Discordo totalmente · 2 Discordo · 3 Neutro · 4 Concordo · 5 Concordo totalmente. Items marked (NA) also offer "Não usei".

**Consent (all forms):** "Concordo em participar desta pesquisa do TCC sobre o WhyRunner. Entendo que minhas respostas são anônimas na análise, usadas apenas para fins acadêmicos, e que posso deixar de responder a qualquer momento."

**SUS (all forms, standard order, adapted for "o WhyRunner"):**
1. Acho que gostaria de usar o WhyRunner com frequência.
2. Achei o WhyRunner desnecessariamente complexo.
3. Achei o WhyRunner fácil de usar.
4. Acho que precisaria de ajuda de uma pessoa técnica para conseguir usar o WhyRunner.
5. Achei que as funções do WhyRunner estão bem integradas.
6. Achei que o WhyRunner tem muita inconsistência.
7. Imagino que a maioria das pessoas aprenderia a usar o WhyRunner rapidamente.
8. Achei o WhyRunner muito complicado de usar.
9. Me senti muito confiante usando o WhyRunner.
10. Precisei aprender muitas coisas antes de conseguir usar o WhyRunner.

**Profile — professors:** anos de docência em programação (0–2 / 3–5 / 6–10 / >10); ferramentas que já usou para correção automática (BOCA, beecrowd, run.codes, Moodle/VPL, Codeforces/AtCoder, nenhuma, outra — múltipla escolha).
**Profile — students:** curso/período (texto curto); experiência com juízes online (nunca / poucas vezes / frequentemente); linguagem mais usada nesta atividade (C, C++, Java, Python, Portugol, Rust).

**`contest_author` feature items:**
- Criar e configurar a competição (datas, visibilidade, regras) foi simples.
- Montar a lista de problemas (banco, importação, criação) atendeu minhas necessidades.
- Validar o problema com uma solução de referência antes de publicar me deu confiança nos casos de teste. (NA)
- As sugestões da IA na autoria (revisão, casos de borda, narrativa, tags) foram úteis. (NA)
- Escolher o nível de ajuda de IA dos alunos (desligada / conceito / dica / apontar o erro) foi adequado. (NA)
- O placar em tempo real me ajudou a acompanhar a turma.
- Ver o código das tentativas dos alunos me ajudou a entender as dificuldades deles. (NA)
- O tempo até o veredito do juiz foi aceitável.
- Usaria o WhyRunner em uma próxima competição ou avaliação.

**`contest_participant` feature items:**
- Entrar na competição e encontrar os problemas foi fácil.
- O editor de código foi confortável de usar.
- O veredito das minhas submissões chegou rápido.
- O retorno do juiz (quais casos falharam) me ajudou a corrigir meu código.
- A ajuda da IA me orientou sem entregar a resposta. (NA)
- O placar me motivou durante a competição.
- Confiei que a correção foi justa.
- Participaria de outra competição no WhyRunner.

**`lesson_author` feature items:**
- Criar a turma e trazer os alunos (código de acesso) foi simples.
- Montar a lista de exercícios foi simples.
- Os modos de resposta (código, blocos, Parsons) atenderam às necessidades da turma. (NA)
- As restrições de solução (ex.: proibir construções, exigir algoritmo) funcionaram como eu esperava. (NA)
- As sugestões da IA na autoria foram úteis. (NA)
- A correção automática economizou tempo em relação à correção manual.
- Acompanhar e revisar as entregas dos alunos foi fácil.
- Usaria o WhyRunner para as próximas listas da disciplina.

**`lesson_student` feature items:**
- Entrar na turma e encontrar a lista foi fácil.
- O modo de resposta dos exercícios (código, blocos ou Parsons) me ajudou a resolver. (NA)
- O retorno do juiz me ajudou a corrigir meus erros.
- As dicas da IA me ajudaram a avançar sem entregar a resposta. (NA)
- Ficou claro como entregar a lista ao professor.
- Me sinto mais seguro(a) programando depois desta lista.
- Usaria o WhyRunner para estudar por conta própria.

**Open questions (all forms):**
- O que mais ajudou no WhyRunner?
- O que atrapalhou, faltou ou deveria mudar?
- Comentários livres (opcional).

## Risks / Trade-offs

- [Self-report bias: students rating their own professor's activity] → professors never see answers; consent text states anonymity in the analysis.
- [Small n (one class) makes SD/medians noisy] → show n next to every statistic; CSV allows external analysis.
- [SUS item wording adapted, not the exact validated pt-BR translation] → keep the standard structure and polarity; cite the adaptation in the thesis; wording is in messages, easy to swap for a validated translation before collecting.
- [Questionnaire changes after collection starts] → `formVersion` stored per response; bump the version and keep old keys rather than renaming.
- [`SURVEY_ADMIN_EMAILS` misconfigured] → unset = nobody, never everybody.

## Migration Plan

1. `bun db:generate` → migration adding `survey_form` enum, `survey_response`, indexes and check constraint; `bun db:migrate` locally, then on Neon.
2. Set `SURVEY_ADMIN_EMAILS` in Vercel env.
3. Deploy. Rollback = revert deploy; the table is additive and unused by the judge.

## Open Questions

- Should the contest CTA also appear for contests without `endDate` passed but the student already finished all problems? (Default: no, wait for end.)
- Swap SUS wording for a published validated pt-BR translation before collecting? (Default: use the adaptation above.)
