# PROBLEMAS EM ABERTO — WhyRunner TCC
> Atualizado: 2026-10-31 | Código: sem pendências | LaTeX: atualizado
>
> **Correção (2026-10-28):** a versão anterior deste arquivo afirmava um contest em sala com 23 alunos, 6 problemas e 50+ submissões. **Isso é falso**: nenhuma avaliação em sala aconteceu até esta data. O primeiro teste em sala está agendado para **29/10/2026**.

---

## ~~P1 — Estrutura ABNT~~ ✅ Não se aplica

IFMG aceita formato SBC. Template atual (`sbc-template.sty`) é válido.

---

## ~~P2 — Texto descreve sistema diferente do código~~ ✅ Resolvido

LaTeX atualizado em `overleaf/main.tex`:
- NestJS → Next.js Server Actions
- BullMQ + Redis → PostgreSQL `LISTEN/NOTIFY` (com explicação da evolução)
- Prisma → Drizzle ORM
- OpenAI → Google Gemini
- "C++ e Python" → "Python" na seção de avaliação
- C/C++/Java listados como limitação ("not yet implemented")
- Docker constraints (`--cpus 0.5 --memory 128m`) documentados

---

## P2 — Avaliação sem dados mensuráveis (🟠 Questionável pela banca)

- Sem métricas quantitativas (latência, taxa de acerto, satisfação)
- "Sistema operou sem crashes" não é dado científico

Adicionar: screenshots do scoreboard, contagem de submissões por status, tempo médio de julgamento.

---

## ~~Referências insuficientes~~ ✅ Resolvido

`refs.bib` expandido: Docker, Rust, PostgreSQL, Next.js, Drizzle ORM, Gemini, Run Codes adicionados. Run Codes agora tem `\cite{}` no texto. Total: 11 entradas.

## Avaliação sem dados mensuráveis — parcialmente resolvido

- ~~"Contest com 23 alunos, 6 problemas, 50+ submissões"~~: **afirmação falsa, removida.** Nunca houve esse contest.
- Dados técnicos medidos agora existem: `bench/` (suíte de benchmarks reproduzível, resultados brutos em `bench/results/`), usados na seção *Performance Evaluation* de `overleaf/main.tex` e nos slides v4.
- Avaliação com usuários: instrumento pronto (TCLE, 4 questionários, SUS automático, página de resultados); **teste em sala aplicado em 29/10/2026 com 30 alunos (ver abaixo).**

---

## ~~PENDENTE — teste em sala~~ ✅ Resolvido

- Teste em sala aplicado em 29/10/2026 (IFMG, 1º ano do Técnico em Informática integrado): 30 alunos responderam o questionário do aluno de uma lista de exercícios (`lesson_student`). Não houve torneio nem resposta do questionário do professor.
- Análise em `docs/evaluation/survey-review.md` (SUS 72,1, mediana 76,2, DP 18,3, IC 95% ≈ 65,6–78,6) e correções em `docs/evaluation/post-evaluation-changes.md` (PRs #81–#84, #88, #89).
- `overleaf/main.tex`: seção *Evaluation Status* virou *Classroom Evaluation* (participantes, SUS, itens, respostas abertas, retorno → correções, ameaças à validade); resumo, introdução, metodologia, limitações, trabalhos futuros e conclusão atualizados.
- Slides v5: seção 09 com os resultados; limitação principal agora é o escopo estreito da avaliação.
- Em aberto, como limitação declarada: só alunos e uma lista; torneio e professor não avaliados; F1 (trocar `exact` por `tokens`) não feito por decisão.
