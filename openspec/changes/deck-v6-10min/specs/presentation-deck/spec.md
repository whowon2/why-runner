## ADDED Requirements

### Requirement: v6 deck is a 10-minute cut of v5
The v6 deck (`WhyRunner — Apresentação TCC II v6.pptx` + `.pdf`) SHALL have exactly 25 slides, taken from v5 in v5 order: cover; problem; research question; gap; professor (publish only with a passing solution, AI reference solutions 18/20, AI level); student (verdicts, failed case + explanation); lessons (blocks, constraints); plagiarism (side by side, 98% precision / 99.5% recall); internals (architecture, network-less sandbox); performance (<18 s with 8 workers, <0.4 s verdict, 63/72 verdicts); evaluation (30 students, SUS 72.1, what helped, fixes); limitation, next steps, thanks. It SHALL NOT contain section dividers, an agenda or a references slide.

#### Scenario: Slide set
- **WHEN** `docs/presentation/v6-slides.txt` is read after a build
- **THEN** it SHALL list 25 slides with the titles above and no "PARTE", "ROTEIRO" or "REFERÊNCIAS" kicker

### Requirement: v6 notes fit ten minutes
v6 speaker notes SHALL be spoken pt-BR, 1,200–1,450 words in total, at most 70 words per slide, each content slide built around one key number or claim that the title already states. The build SHALL print the total and the estimated time at 130 and 150 words per minute.

#### Scenario: Timing printout
- **WHEN** `build_v6.py` runs
- **THEN** it SHALL print the total note words and an estimate between 8 and 11 minutes

### Requirement: v6 section progress bar
Each v6 content slide SHALL show a progress bar in the kicker row with one chip per section (abertura, professor, aluno, aulas, plágio, por dentro, desempenho, avaliação, fecho), the current section highlighted and the sections already shown dimmed. Kickers SHALL name the section without the v5 "NN · " part number.

#### Scenario: Progress
- **WHEN** a performance slide is viewed
- **THEN** the "desempenho" chip SHALL be highlighted and the chips before it SHALL look done

### Requirement: v6 is built from v5's builder
The v6 deck SHALL be produced by `docs/presentation/build_v6.py`, which reuses `build_v5.py`'s builders and package writer, so the kept slides look the same as in v5. Changes to `build_v5.py` SHALL NOT change the v5 output.

#### Scenario: v5 unchanged
- **WHEN** `build_v5.py` is run into a scratch path after the refactor
- **THEN** its slide XML SHALL match the committed v5 deck
