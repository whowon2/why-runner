# Survey review: classroom test 2026-10-29

Source: `lesson_student` export (form v1), 30 responses, all for the lesson
"Lista de exercícios 12 - extra 2", submitted 08:31–08:41 (BRT). No
`lesson_author` or contest responses were exported. Answers are anonymous in
this file; raw CSV is not checked in.

## Who answered

- 30 students, all 1st year of the Técnico em Informática (integrated high
  school) course at IFMG.
- 24 had **never** used an online judge, 6 had used one a few times.
- All 30 used Python.

## SUS (System Usability Scale)

| Metric | Value |
|---|---|
| Mean | **72.1** |
| Median | 76.2 |
| Std. dev. | 18.3 |
| Range | 22.5 – 95 |

Distribution (Bangor/Sauro grades): 13 ≥ 80.3 (A), 4 in 68–80 (B/C),
8 in 51–67 (C/D), 5 < 51 (F). No respondent straight-lined the 10 items.

Reading: 72.1 is above the 68 benchmark ("good", grade C+/B−), with a wide
spread. The median (76.2) is higher than the mean: a small group of low scores
pulls it down. Per item (1–5, odd items positive, even items negative):

| Item | Mean | Reading |
|---|---|---|
| sus5 functions well integrated | 4.13 | strong |
| sus7 most people learn quickly | 4.07 | strong |
| sus3 easy to use | 3.93 | good |
| sus2 unnecessarily complex (neg.) | 1.87 | good |
| sus8 cumbersome (neg.) | 1.97 | good |
| sus6 inconsistent (neg.) | 2.03 | good |
| sus10 needed to learn a lot first (neg.) | 2.13 | ok |
| sus1 would use frequently | 3.77 | ok |
| sus9 felt confident | 3.50 | weakest positive |
| sus4 would need technical support (neg.) | **2.57** | weakest; 9 of 30 answered 4–5 |

Confidence (sus9) and needing support (sus4) are the weak spots, consistent
with an audience where 80% had never used a judge.

## Specific items (1–5 agreement)

| Item | Mean | n | Notes |
|---|---|---|---|
| Joining the class and finding the list was easy | **4.70** | 30 | 24 answered 5 |
| Clear how to hand in the list | 4.43 | 30 | no answer below 3 |
| Would use WhyRunner to study alone | 4.13 | 30 | 24 answered 4–5 |
| AI hints helped without giving the answer | 4.04 | 23 | 7 "didn't use" |
| Judge feedback helped fix my errors | 3.53 | 30 | 6 answered 1–2 |
| Answer mode helped me solve | 3.41 | 29 | everyone used plain code |
| Feel more confident programming after the list | **3.23** | 30 | lowest |

## Open answers

### What helped (30 answers, grouped)

- **AI assistance**, ~14 mentions: "A ajuda praticamente em tempo real da ia é
  sensacional", "As dicas sem entregar a resposta da IA", "O feedback feito por
  IA me ajudou a encontrar erros mais facilmente".
- **Immediate automatic correction**, ~9: "Seu método quase instantâneo de
  corrigir", "respostas e feedbacks quase imediatos".
- **Classroom flow** (rooms, handing in, knowing the expected output), ~3.
- Interface easy to use, autocomplete, ~2.

### What hindered (grouped, with status)

| Theme | Mentions | Example | Status |
|---|---|---|---|
| Output must match exactly (spaces, one letter) | **~9** | "a saída precisa ser exatamente igual aos exemplos… tive que refazer várias vezes" | **Fixable now (data)**: the `tokens` compare mode already exists (migration 0048), but problems created before migration 0048 were set to `exact`. Switching the lesson's problems to `tokens` removes the whitespace complaints. Letter-case/wording differences stay a teaching point. |
| Judge errors unclear; no actual output; no Python traceback | ~6 | "mostrar como ficou a minha saída… tive que abrir outro editor"; "Não encontrei os erros que aparecem no próprio python" | **Fixed** (#83): exercises now render `SubmissionDetails`, which shows input / your output / expected and the stderr (Python traceback) for visible tests. Hidden tests still hide them by design. |
| Can't run code before submitting / test with my own input | 2 | "deveria ter como rodar o programa antes de enviar" | **Fixable, new feature**: a "Run with custom input" that uses the judge without grading. Medium effort (judge + rate limit). |
| Small editor / screen | 3 | "A tela ser pequena", "Tela cheia" | **Fixed** (#81: fullscreen + font size). |
| AI explanation panel can't be scrolled; wanted it as a side panel | 2 | "não da para subir ou descer a página para ler tudo" | **Bug, fixable**: confirmed, `ai-dialog.tsx`'s `DialogContent` has no max height or overflow, so long answers run off screen. Side-panel layout is a follow-up. |
| Changing the site language erased the code | 1 | "Se eu tentar mudar o idioma do site depois de já ter feito código, ele apaga todo" | **Fixable**: keep the editor draft (localStorage per exercise) across locale navigation. pt-BR default (#81) makes it rarer. |
| Code "in Portuguese" broke Python | 1 | "deu erro porque tava em portugês" | **Likely fixed** (#81: Google Translate no longer rewrites code). |
| Verdict far from the editor | 1 | "a parte que me diz se eu errei ou acertei ficasse… perto do próprio código" | Fixable (layout). |
| Auto-closing brackets intrusive | 1 | "parênteses, chaves e colchete… fechando automaticamente" | Fixable (editor setting, maybe a toggle next to font size). |
| Pasting code from another editor | 1 | — | Needs investigation. |
| Problem statements unclear / exercises too hard | 3 | "faltaram explicações mais simples" | **Content, not platform**: teacher writes the statements. The AI problem review can point out ambiguity. |
| "Bugs" (no detail) | 1 | — | Can't act on it. |

### Wishes outside scope

- Mobile app, avatars/personalization, more languages. Not planned for the
  thesis; mobile web layout is the realistic answer.

### Accessibility

One student said they are deaf and found it a bit hard but would keep trying.
The platform is text-based, so hearing is not needed to use it. Their
difficulty is more likely the Portuguese-heavy instructions. Clearer
statements, examples and visible test cases help here too. Worth one
sentence in the thesis as a limitation/future work (accessibility review not
done).

### General comments

All 7 general comments are positive: easy, well organized for beginners,
"não mostra resposta, o que é muito bom, pois desenvolve o raciocínio
lógico", "usaria sempre".

## Summary

**Good**
- Very easy to join and find work (4.70) and to hand in (4.43).
- AI help that doesn't give the answer is the most valued feature, in both
  the Likert item (4.04) and free text.
- Fast automatic feedback is valued.
- Most would use it to study alone (4.13). SUS 72.1 is above average.

**Bad**
- Exact output matching was the top complaint.
- Judge feedback (3.53) was weaker than AI help: students didn't see their
  own output or Python errors.
- Low confidence gain (3.23) and the wish for support (sus4 2.57), for a
  class that was 80% new to judges.

## Fixes

### Already fixed (PRs #81–#83, see `post-evaluation-changes.md`)

| Survey complaint | Fix |
|---|---|
| Small editor / screen (3) | Fullscreen toggle and font size (#81) |
| Code "in Portuguese" broke Python (1) | Code surfaces marked `translate="no"` so Google Translate can't rewrite them (#81) |
| No actual output, no Python traceback, unclear judge errors (~6) | Exercises show input / your output / expected / stderr for visible tests (#83) |

### To fix (by impact)

| # | Survey complaint | Fix | Effort |
|---|---|---|---|
| F1 | Output must match exactly (~9) | Switch the lesson's pre-0048 problems from `exact` to `tokens` comparison; make the problem editor show the compare mode prominently | XS (data) |

Evidence for F1 (production submissions, read-only): the lesson had two
problems, both `exact`: G "Matriz ao cubo" (5 tests, expected output has a
trailing space after every number) and H "Histograma da temperatura".
G: 31 students tried, 19 passed, 20 PASSED vs 129 FAILED submissions. Of the
G failures, **26 (from 13 students) differed from the expected output only in
whitespace** and would have passed under `tokens`; 12 of those 13 students
eventually passed after extra attempts, 1 never did. Other G failures: 36
runtime error / no output, 31 wrong output (many printed `input()` prompts
like "Digite os valores…" into stdout), 5 letter case only. H: 13 tried,
4 passed; failures were runtime errors or wrong output, none whitespace-only.
In all of production, 17 of 18 problems are `exact`.
| F2 | AI panel can't be scrolled (2) | `max-h` + `overflow-y-auto` on the AI dialog; later a dockable side panel **Fixed (web 1.1.0).** | XS |
| F3 | Changing site language erased the code (1) | Persist the editor draft per exercise/problem in localStorage, restore on mount **Fixed (web 1.1.0).** | S |
| F4 | Auto-closing brackets intrusive (1) | Toggle next to the font-size control (Monaco `autoClosingBrackets`), persisted **Fixed (web 1.1.0).** | XS |
| F5 | Verdict far from the editor (1) | Show the latest verdict badge in the editor toolbar, near submit **Fixed (web 1.1.0).** | S |
| F6 | Can't run before submitting (2) | "Run with custom input": a non-graded judge run with rate limit, no submission row | M (web + judge) |
| F8 | Wrong output from `input("Digite…")` prompts (found in the data, 31 G failures) | Explain it in the failure view: when the actual output has extra text before the expected lines, show a hint "don't print prompts in `input()`" **Fixed (web 1.1.0).** | S |
| F7 | Pasting code from another editor (1) | Reproduce first (likely indentation tabs vs spaces or smart quotes); fix if confirmed **Fixed (web 1.1.0).** | S, unknown |

## No fixes

| Survey complaint | Why not |
|---|---|
| Exact letters/wording must match ("uma única letra errada") | Part of what a judge teaches: output spec is the contract. `tokens` (F1) removes whitespace noise; casing and wording stay strict. Teacher can choose `float` or a custom checker per problem. |
| Problem statements unclear / exercises too hard (3) | Content written by the teacher, not the platform. The existing AI problem review can flag ambiguity before publishing. |
| Hidden tests don't show output | By design: hidden tests stop students coding against the answers. Teacher chooses which tests are visible (#83). |
| Mobile app (1) | Out of scope for the thesis; the web app is the platform. Mobile web layout is future work. |
| Avatars / personalization (1) | Not related to learning goals; out of scope. |
| More programming languages (1) | Already supports C, C++, Java, Python, Portugol, Rust; adding more is future work, not a defect. |
| "Bugs" with no detail (1) | Not actionable. |
| Accessibility for a deaf student (1) | No specific barrier reported (the platform is text-only). A proper accessibility review is future work, stated as a limitation. |

## Limitations

- One class, one 10-minute survey window right after one session, one
  lesson, Python only: no comparison group and no pre/post measure.
- 30 respondents. Large enough for SUS to be stable to about ±7 points
  (95% CI ≈ 65.6–78.6), too small for subgroups.
- Novelty effect, and possible social desirability if the students knew the
  developer was present.
- Answer-mode item only covers plain code; blocks and Parsons weren't used.
