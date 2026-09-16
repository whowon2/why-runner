## MODIFIED Requirements

### Requirement: Fact rows cover identity and skills
The fact-row list SHALL include, in order, whichever of the following are available for the user: bio, location, website, joined date, contest count, problem count, theme skills, and language skills — each as a single `label: value` row. There is no global-rank row, and no follower/following count row. The contest count and problem count rows SHALL reflect that user's actual number of contests and problems, never a hardcoded or placeholder value.

#### Scenario: All fields present
- **WHEN** a user has a bio, location, website, join date, contest count, problem count, and at least one theme skill and one language skill
- **THEN** each of these appears as its own labeled row in the stated order

#### Scenario: Optional field absent
- **WHEN** a user has no `location` set
- **THEN** no location row is rendered, and no gap is left in its place

#### Scenario: Skills row packs multiple values
- **WHEN** a user has more than one theme skill
- **THEN** the theme skills row displays all of that user's theme skill values together on the same labeled row, wrapping onto additional lines only if they do not fit

#### Scenario: Contest and problem counts reflect real data
- **WHEN** a user has created 2 contests and 5 problems
- **THEN** the contest count row shows `2` and the problem count row shows `5`, sourced from the user's actual records rather than a fixed value

#### Scenario: Counts are zero
- **WHEN** a user has created no contests and no problems
- **THEN** the contest count row shows `0` and the problem count row shows `0`
