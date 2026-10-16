## ADDED Requirements

### Requirement: Deck carries the presentation date
The v3 deck SHALL show the date 16/10/2026 on the title slide. The cronograma slide SHALL be an ordered sequence of steps (what comes after what) with no dates or months at all, ending in "Defesa" with no date. It SHALL contain no `[data]`, `[mês]` or `[outubro]` placeholders.

#### Scenario: Title date
- **WHEN** the title slide is viewed
- **THEN** it SHALL read "16/10/2026" where v2 read "[data]"

#### Scenario: No placeholders left
- **WHEN** the exported PDF text is searched for `[data]`, `[mês]` or `[outubro]`
- **THEN** no match SHALL be found

#### Scenario: Cronograma is sequence-only
- **WHEN** the cronograma slide is viewed
- **THEN** it SHALL show numbered steps linked in order (e.g. arrows) and SHALL show no month names or dates

### Requirement: Architecture slide shows the AI provider chain
The architecture slide SHALL draw the AI provider chain as ordered, connected boxes: Gemini 3.5 Flash → Gemini 3.5 Flash-Lite → Claude Haiku 5.5. It SHALL note that Haiku is used only when an Anthropic key is configured, and that each attempt times out after 30 s. Model names SHALL match `web/lib/ai-models.ts`.

#### Scenario: Haiku visible as fallback
- **WHEN** the architecture slide is viewed
- **THEN** Claude Haiku 5.5 SHALL appear as its own box at the end of the fallback chain, not only in a caption

### Requirement: Validation topics are separate slides
Technical validation (automated judge tests), problem validation (reference solution run before publishing), the informal pilot and the planned user evaluation SHALL each have their own slide. No slide SHALL combine two of them.

#### Scenario: Problem validation slide
- **WHEN** the problem-validation slide is viewed
- **THEN** it SHALL show the "Validar antes de publicar" screenshot and explain that the creator picks a language, can generate a reference solution with AI ("Gerar com IA"), runs it against all test cases, and must re-validate after editing tests before publishing

#### Scenario: Technical validation slide
- **WHEN** the technical-validation slide is viewed
- **THEN** it SHALL show the 29 judge tests broken down by category and nothing about problem validation or users

### Requirement: Informal pilot is labelled honestly
The deck SHALL include a slide about the informal pilot run with 5 colleagues on the author's Discord server. It SHALL list negative feedback items paired with the shipped change that addressed each, plus positive feedback items. It SHALL be labelled informal/pilot, and it SHALL NOT present the pilot as the planned study or use SUS scores from it. Every feedback item SHALL be one the author confirms was actually reported.

#### Scenario: Feedback mapped to fixes
- **WHEN** the pilot slide lists a complaint (e.g. "lista de torneios não atualizava ao excluir")
- **THEN** it SHALL name the fix that addressed it (e.g. the contest-list refresh fix)

#### Scenario: Unconfirmed feedback excluded
- **WHEN** the author does not confirm that a candidate feedback item was reported in the pilot
- **THEN** that item SHALL NOT appear on the slide

### Requirement: Planned classroom evaluation remains stated as pending
The deck SHALL keep a slide stating that the classroom evaluation has not been run yet. That slide SHALL cover the real class (tournament + lesson), the SUS questionnaire, and the teacher's perspective on building lessons and tournaments. The discussion slide SHALL keep "ainda sem avaliação com alunos" as a limitation.

#### Scenario: Limitation kept
- **WHEN** the discussion slide is viewed
- **THEN** it SHALL still list the missing classroom evaluation as a limitation

### Requirement: Shipped features are shown with screenshots
The deck SHALL include real screenshots of the running app for each of these features:
- AI problem-narrative generation
- automatic tag selection
- problem preview
- AI review for missing edge cases
- problem list with filters (tags, difficulty, code, own problems)
- tournament creation, including the private-tournament option
- tournament problem selection and search by problem code
- tournament editor
- tournament leaderboard
- syntax-highlighted editor with autosave indicator
- submission list with expandable code, copy button and "Explicar" (AI) button
- Blockly and Parsons exercise formats
- teacher review of student lesson submissions
- class join-code generation

Solution constraints SHALL stay covered by the existing lesson slide and SHALL NOT get a new slide.

#### Scenario: Feature coverage check
- **WHEN** the deck is reviewed against the feature list above
- **THEN** each feature SHALL appear in at least one slide as a screenshot, not only as text

#### Scenario: Constraints not duplicated
- **WHEN** the deck is reviewed
- **THEN** solution constraints SHALL appear only on the lesson slide (former slide 10)

### Requirement: Deck is reproducible and prior versions are preserved
The v3 deck SHALL be saved as new `.pptx` and `.pdf` files. The v1 and v2 files SHALL remain unchanged. Every screenshot used SHALL be stored under `docs/presentation/screenshots/`. Speaker notes SHALL be updated for every new or changed slide.

#### Scenario: v2 untouched
- **WHEN** `git diff` is run after the change
- **THEN** the v1 and v2 deck files SHALL show no modifications
