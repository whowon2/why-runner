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

