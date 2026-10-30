## ADDED Requirements

### Requirement: Editor drafts are saved per user, target and language
The lesson exercise editor, the problem Submit tab editor and the contest problem editor SHALL save the editor's code to `localStorage` under a key made of the signed-in user's id, the target (exercise id, problem id, or contest id plus problem id) and the selected language. They SHALL also save the last language used for that user and target. Code that is blank or equals the selected language's starter template SHALL NOT be saved. Saving SHALL happen shortly after edits, when the page is hidden and when the editor unmounts. Without a signed-in user, or when `localStorage` is unavailable, nothing SHALL be saved and the editor SHALL keep working.

#### Scenario: Draft saved while typing
- **WHEN** a signed-in student edits Python code on an exercise and waits one second
- **THEN** `localStorage` holds that code under a key containing the student's id, the exercise id and `python`

#### Scenario: Untouched starter not saved
- **WHEN** a student selects `python` and does not edit the starter template
- **THEN** no draft is stored for that exercise and language

#### Scenario: Storage blocked
- **WHEN** `localStorage` throws on access
- **THEN** the editor works normally without saving and shows no error

### Requirement: Drafts are restored when the editor mounts
When an editor mounts for a user and target with a saved last language, the editor SHALL select that language and show that language's saved draft, or the language's starter template if no draft exists. Restoring SHALL NOT replace code the user has already edited in the current page.

#### Scenario: Locale switch keeps the code
- **WHEN** a student writes code on a problem's Submit tab and switches the site language from pt-BR to en
- **THEN** after the page reloads in English the editor shows the same language and the same code

#### Scenario: Different user on the same browser
- **WHEN** student A leaves a draft, signs out, and student B signs in on the same browser and opens the same exercise
- **THEN** student B's editor does not show student A's draft

#### Scenario: Starter saved in another locale
- **WHEN** a student selected `python`, left the pt-BR starter untouched, and switches to en
- **THEN** the editor shows the English starter template for `python`

### Requirement: Drafts are cleared on acceptance and reset
A saved draft SHALL be removed when the newest submission for that user and target is `PASSED` and its code equals the saved draft for its language. The draft for the current language SHALL also be removed when the user resets the editor to the starter code. The code visible in the editor SHALL NOT change when a draft is removed on acceptance.

#### Scenario: Accepted clears the draft
- **WHEN** a student's submission of the saved draft becomes `PASSED` and the student reloads the page
- **THEN** no draft is restored for that language

#### Scenario: Older pass does not clear newer work
- **WHEN** a submission becomes `PASSED` but the student has edited the code since submitting
- **THEN** the newer draft stays saved

#### Scenario: Reset clears the draft
- **WHEN** a student resets to starter code and reloads without editing
- **THEN** the editor shows the starter template
