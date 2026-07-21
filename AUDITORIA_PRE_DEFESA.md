# PROBLEMAS EM ABERTO — WhyRunner TCC
> Atualizado: 2026-04-19 | Código: sem pendências | LaTeX: atualizado

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

## ~~Avaliação sem dados mensuráveis~~ ✅ Resolvido

Seção de avaliação reescrita com duas tabelas: parâmetros do contest (23 alunos, 6 problemas, 50+ submissões, 0 crashes) e resultados observados. Seções Evaluation e Results agora separadas com dados concretos.

---

## SEM PENDÊNCIAS

Código e documento estão prontos para defesa.
