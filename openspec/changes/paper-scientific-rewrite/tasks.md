## 1. Framing (user confirmation)

- [ ] 1.1 Propose new title and section outline to the user; get approval
- [ ] 1.2 Ask the user for a read-only production DB access route (or skip log analysis)

## 2. PRINCIPAL: cut technical detail + title (EN, then pt-BR)

- [ ] 2.1 New title, abstract and resumo
- [ ] 2.2 Replace System Design with pedagogical design + short implementation subsection (absorbs development history)
- [ ] 2.3 Collapse Performance Evaluation into a short technical-validation summary; drop concurrency/lang-cost tables and verdict/similarity figures
- [ ] 2.4 Mirror 2.1–2.3 in main-ptbr.tex

## 3. Introduction and Methodology

- [ ] 3.1 Introduction: problem, research question, contributions
- [ ] 3.2 Methodology as research design (approach, setting, participants, instruments, analysis), ethics wording unchanged
- [ ] 3.3 Mirror in main-ptbr.tex

## 4. Related work

- [ ] 4.1 Verify and add refs (beecrowd, DOMjudge, CodeRunner, others) to refs.bib
- [ ] 4.2 Rewrite Related Work (judges + AI feedback) with honest novelty framing
- [ ] 4.3 Revise Table 1 on pedagogical dimensions
- [ ] 4.4 Mirror in main-ptbr.tex

## 5. AI-hint log analysis (conditional)

- [ ] 5.1 Run read-only queries on ai_usage + submissions (only if access granted and rows exist)
- [ ] 5.2 Add results paragraph/figure (EN + pt chart) or record that it was left out

## 6. Discussion, conclusion, verification

- [ ] 6.1 Discussion answers the research question; limitations kept
- [ ] 6.2 Conclusion aligned with contributions
- [ ] 6.3 Compile both files in texlive/texlive; ≤14 pages, no undefined refs/citations
- [ ] 6.4 Commit and open PR
