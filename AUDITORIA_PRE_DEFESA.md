# PROBLEMAS EM ABERTO — WhyRunner TCC
> Atualizado: 2026-10-28 | Código: sem pendências | LaTeX: atualizado
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
- Avaliação com usuários: instrumento pronto (TCLE, 4 questionários, SUS automático, página de resultados); **primeiro teste em sala em 29/10/2026, ainda sem resultados.**

---

## PENDENTE

- Aplicar o teste em sala (29/10/2026), analisar os dados e atualizar *Evaluation Status* em `overleaf/main.tex` e os slides.
