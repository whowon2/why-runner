# list-search-input Specification

## Purpose
Keeps the shared list-page search box (problems, contests, admin lists) responsive: typing is local and instant, and the search is applied to the URL and list query once per typing pause.
## Requirements
### Requirement: List search input is debounced
The shared list-page search input (problems, contests, admin lists) SHALL show each typed character immediately from local state and SHALL apply the search (URL update, page reset to 1, list query) only after the user has stopped typing for 300 ms. A burst of keystrokes SHALL produce at most one search update and one list request for the final text.

#### Scenario: Typing a word
- **WHEN** the user types "soma" quickly into the problems search box
- **THEN** each character appears without delay, and about 300 ms after the last key the URL gets `q=soma`, the page resets to 1 and one list request is sent

#### Scenario: Previous results stay visible
- **WHEN** a debounced search is fetching
- **THEN** the previous results stay on screen until the new ones arrive instead of flashing to a skeleton

### Requirement: Search input follows external URL changes
The search input SHALL replace its text with the current search value whenever that value changes from outside the input (browser Back/Forward, a link, a cleared filter), and SHALL NOT issue a search update for that change.

#### Scenario: Back navigation
- **WHEN** the user searched "a", then "ab", and presses Back
- **THEN** the input shows the search value of the restored URL

### Requirement: Shared debounce hooks
The web app SHALL provide `useDebouncedValue` and `useDebouncedCallback` hooks in `web/hooks/use-debounced.ts`, and the in-app search comboboxes (problem picker, co-teacher search) SHALL use them instead of hand-rolled timers.

#### Scenario: Problem picker search
- **WHEN** the user types in the problem picker
- **THEN** the problems query runs with the text only after a 250 ms pause, as before
