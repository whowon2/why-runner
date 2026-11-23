# translation-safe-rendering Specification

## Purpose
Defines which surfaces opt out of browser page translation (code, program I/O, language names) so translators such as Google Translate cannot crash React-managed code views, while the rest of the page stays translatable.
## Requirements
### Requirement: Code surfaces opt out of page translation
Every element that renders source code, program input/output or a programming-language name SHALL carry `translate="no"` and the `notranslate` class, so that browser page translators (e.g. Google Translate) neither rewrite its text nodes nor translate code. This covers at least: every Monaco editor container, the language selector's trigger and its portalled dropdown content, test-case and example input/output blocks, submission result/diff blocks, submitted-code views, Parsons lines, the generated Portugol panel, code-similarity views, and `pre`/`code` elements rendered from problem markdown.

#### Scenario: Choosing a language with Google Translate active
- **WHEN** a student with Google Translate translating the page to Portuguese opens a lesson exercise and selects a language
- **THEN** the starter code loads in the editor and no React DOM error (`removeChild` / `insertBefore`) is thrown

#### Scenario: Switching language repeatedly while translated
- **WHEN** the same student switches language several times and presses the reset-code button
- **THEN** the editor and selector keep working and the selector shows the chosen language name untranslated

#### Scenario: Test-case I/O stays literal
- **WHEN** a translated page shows a test case whose input is `hello world`
- **THEN** the input block still shows `hello world`

### Requirement: Surrounding UI stays translatable
The opt-out SHALL be scoped to code surfaces; the rest of the page (descriptions, labels, buttons) SHALL remain translatable, and the document root SHALL NOT be marked `translate="no"`.

#### Scenario: Problem description translated
- **WHEN** an English-speaking visitor translates a Portuguese problem page
- **THEN** the description prose is translated while its code blocks and examples are not

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

### Requirement: Brand name opts out of page translation
Every visible occurrence of the brand name ("Why Runner" or "WhyRunner") rendered as page text SHALL sit inside an element carrying `translate="no"` and the `notranslate` class. This covers at least the landing hero, the footer copyright, every legal page text and every survey text that mentions the brand. Text around the brand SHALL remain translatable.

#### Scenario: Footer translated to Portuguese
- **WHEN** a visitor translates an English page with Google Translate
- **THEN** the footer reads "© <year> Why Runner" with the name unchanged while the rest of the page is translated

#### Scenario: Legal page mentions the brand
- **WHEN** the Terms of Use page is rendered
- **THEN** each "Why Runner" in its text is wrapped in an element with `translate="no"`

### Requirement: User names opt out of page translation
User display names and `@username` handles shown in contest leaderboards and participant lists, class rosters and gradebooks, admin tables, similarity reports and profile headers SHALL carry `translate="no"`.

#### Scenario: Leaderboard translated
- **WHEN** a translated contest leaderboard lists a user named "Rose Garden"
- **THEN** the row still shows "Rose Garden"

### Requirement: Document language matches the locale
The root `<html>` element SHALL declare `lang="pt-BR"` on `br` locale pages and `lang="en"` on `en` locale pages. The document root SHALL NOT be marked `translate="no"` and the app SHALL NOT emit `<meta name="google" content="notranslate">`.

#### Scenario: Portuguese page
- **WHEN** a visitor opens `/br/problems`
- **THEN** the document has `lang="pt-BR"` and Chrome does not offer to translate it from English

#### Scenario: English page
- **WHEN** a visitor opens `/en/problems`
- **THEN** the document has `lang="en"`

