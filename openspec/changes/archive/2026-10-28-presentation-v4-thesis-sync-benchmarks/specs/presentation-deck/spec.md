## ADDED Requirements

### Requirement: v4 deck is light — one idea per slide
The v4 deck (`WhyRunner — Apresentação TCC II v4.pptx` + `.pdf`) SHALL have one idea per slide, with the title written as the claim in a full sentence. Each content slide SHALL carry at most one screenshot or chart, at least 80% of the slide width (two only for a before/after or side-by-side comparison), at most ~12 words of body text outside the title, and lists of at most 3 pills. Every slide SHALL have full speaker notes carrying the detail removed from the slide.

#### Scenario: Density check
- **WHEN** the build script's lint pass counts body words per slide
- **THEN** no content slide SHALL exceed 12 body words outside the title, kicker, footer and speaker notes

#### Scenario: Notes present
- **WHEN** any slide's notes are read
- **THEN** they SHALL be non-empty and explain the slide in full sentences

### Requirement: Dense v3 slides are split
The v4 deck SHALL split: architecture (overview; AI chain), technical validation (judge tests; CI), authoring (narrative/tags; AI edge-case review; preview), problem bank (filters; JSON import), solve (editor/autosave; submissions/Explicar; failed test case), create contest (settings/privacy/AI level; add problems by code; private join approval), leaderboard (standings; legend), formats (Blocks; Parsons; class join code; lesson deadlines), pilot (what bothered → what changed; what they liked), planned evaluation (survey form; SUS; results page; classroom test 29/10).

#### Scenario: Architecture split
- **WHEN** the architecture section is viewed
- **THEN** the system overview and the AI provider chain SHALL be on separate slides

### Requirement: v4 shows everything shipped since v3
The v4 deck SHALL have slides for: each distinct verdict with its badge, compare modes, the checker protocol diagram, the concurrent worker-pool diagram, the plagiarism pipeline diagram (tokens → k-grams → winnowing → fingerprints), plagiarism pair list, side-by-side matches, gradebook + CSV, `/home`, command palette, notifications, in-app surveys, CI, and other shipped features found in the archived changes not shown in v3.

#### Scenario: Feature coverage
- **WHEN** the deck is checked against the list above
- **THEN** each item SHALL have at least one slide

### Requirement: One slide per benchmark chart
Every chart in `docs/presentation/charts/` that the suite produces SHALL appear on its own slide, with the measured headline in the title and the method, hardware and caveats in the notes. The concurrency slides SHALL state that the production judge (Fly `shared-cpu-1x`) resolves to one worker and gains nothing today.

#### Scenario: Honest concurrency caveat
- **WHEN** the concurrency chart slide is presented
- **THEN** the slide or its notes SHALL say production runs with one worker on one vCPU

### Requirement: Classroom test is stated as scheduled, with no results
The v4 deck SHALL present the first classroom test as scheduled for 29/10/2026 and SHALL NOT show or imply any classroom results, student counts or SUS scores. The cronograma SHALL be the ordered sequence: classroom test 29/10 → analysis → defense.

#### Scenario: No invented results
- **WHEN** the exported PDF text is searched for "23 alunos" or a SUS score
- **THEN** no match SHALL be found

### Requirement: v4 is reproducible and earlier decks are preserved
`docs/presentation/build_v4.py` SHALL build the v4 `.pptx` from the v3 `.pptx` plus `docs/presentation/screenshots/` and `docs/presentation/charts/`. v1, v2 and v3 files SHALL remain unchanged.

#### Scenario: v3 untouched
- **WHEN** `git diff --stat main` is run
- **THEN** no v1, v2 or v3 deck file SHALL appear
