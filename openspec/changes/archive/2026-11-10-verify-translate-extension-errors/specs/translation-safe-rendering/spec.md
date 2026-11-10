## ADDED Requirements

### Requirement: Coding flow survives page translation
With a browser translate extension translating the page, the lesson exercise workspace and the problem workspace SHALL keep working through the whole coding flow (typing code, running it, submitting it, showing the verdict and submission history, switching the site locale) without React DOM errors (`removeChild` / `insertBefore` on translator-replaced text nodes) or the app error boundary appearing.

#### Scenario: Run and submit on a translated lesson exercise
- **WHEN** a student translates a lesson exercise page with a translate extension, writes code, runs it and submits it
- **THEN** the run output and the verdict appear and the console shows no React DOM error

#### Scenario: Run and submit on a translated problem page
- **WHEN** a user translates a problem page, runs custom input and submits
- **THEN** the console panel, verdict and submission history update without a React DOM error

#### Scenario: Switch site locale while translated
- **WHEN** the same user switches the site locale from the header while the page is translated
- **THEN** the page re-renders in the new locale without the error boundary appearing
