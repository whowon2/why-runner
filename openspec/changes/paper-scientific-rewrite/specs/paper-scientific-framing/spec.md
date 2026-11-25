## ADDED Requirements

### Requirement: Paper is framed around teaching
The title, abstract and resumo of `overleaf/main.tex` and `overleaf/main-ptbr.tex` SHALL describe WhyRunner as a tool for teaching programming and SHALL summarise the research question and classroom findings, not the architecture.

#### Scenario: Reader reads the title and abstract
- **WHEN** a reader reads only the title and abstract
- **THEN** they learn the educational problem, the research question, and the classroom result, and the abstract names no infrastructure component (sandbox, queue, worker pool)

### Requirement: Introduction states research question and contributions
The Introduction SHALL state the problem being addressed, an explicit research question, and an itemised list of contributions that the paper actually delivers.

#### Scenario: Reader looks for the research question
- **WHEN** a reader reads the Introduction
- **THEN** it contains a sentence explicitly labelled as the research question and a list of contributions, each backed by a later section

### Requirement: Methodology describes research design
The Methodology section SHALL describe the research approach, setting, participants, instruments and data analysis. Development history (technology migrations, MVP, security review) SHALL appear only in the implementation part of the system section.

#### Scenario: Reader reads Methodology
- **WHEN** a reader reads the Methodology section
- **THEN** it mentions no technology migration (BullMQ, SQS, Supabase, Docker socket) and does describe the instruments and analysis

### Requirement: Related work covers known judges and AI feedback
Related Work SHALL discuss beecrowd, DOMjudge, CodeRunner and BOCA among judges, and LLM-based feedback tools for programming education including CodeHelp (Liffiton et al. 2023), and SHALL acknowledge that AI feedback tools already exist. Table 1 SHALL compare WhyRunner with them on pedagogical dimensions, filling cells only from cited sources.

#### Scenario: Reader checks novelty claim
- **WHEN** a reader reads Related Work
- **THEN** it does not claim WhyRunner is the first tool with AI feedback, and states what is new relative to CodeHelp-like tools

### Requirement: Technical detail is limited
The paper SHALL NOT contain implementation-level detail that does not support a teaching claim (per-language resource limits, worker-pool internals, CI job counts, CSV escaping, per-language benchmark tables).

#### Scenario: Reader scans for benchmark tables
- **WHEN** a reader looks for the concurrency and per-language cost tables
- **THEN** they are absent, and technical validation is summarised in at most about half a page with a pointer to the reproducible `bench/` suite

### Requirement: Claims and citations are honest
Every reference added to `refs.bib` SHALL be verified to exist with correct metadata. Every number in the paper SHALL come from `bench/`, `docs/evaluation/`, or read-only production queries actually run. The ethics/consent wording SHALL remain unchanged unless the user approves an edit.

#### Scenario: Log data unavailable
- **WHEN** production logs for AI hints cannot be obtained or were pruned
- **THEN** the paper contains no log-based result about hints

### Requirement: English and Portuguese versions stay in sync within page limit
`main.tex` and `main-ptbr.tex` SHALL have the same sections, tables, figures and claims, and each SHALL compile with the `texlive/texlive` image into at most 14 pages.

#### Scenario: Compile check
- **WHEN** both files are compiled with pdflatex + bibtex in the `texlive/texlive` docker image
- **THEN** both compile without errors or undefined references and each PDF has ≤14 pages
