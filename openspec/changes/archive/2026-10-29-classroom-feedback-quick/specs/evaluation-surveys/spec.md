## ADDED Requirements

### Requirement: Every Likert point is labelled
Each Likert item SHALL show the label of every scale point, not only the two ends: 1 "Discordo totalmente", 2 "Discordo", 3 "Neutro", 4 "Concordo", 5 "Concordo totalmente" (and their English equivalents in the `en` locale), plus "Não usei" where the item allows it. Each label SHALL be visibly tied to its point (on or directly under the option) and SHALL stay readable on a phone-width screen.

#### Scenario: Respondent reads the middle of the scale
- **WHEN** a respondent opens any form in Portuguese
- **THEN** options 2, 3 and 4 show "Discordo", "Neutro" and "Concordo" next to their numbers

#### Scenario: English locale
- **WHEN** a respondent opens a form under `/en`
- **THEN** the five points show "Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"

#### Scenario: Narrow screen
- **WHEN** a respondent opens a form on a 360px-wide screen
- **THEN** every label is visible without horizontal page scrolling
