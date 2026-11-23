## ADDED Requirements

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
