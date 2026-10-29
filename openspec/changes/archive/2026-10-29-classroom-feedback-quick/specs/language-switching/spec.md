## ADDED Requirements

### Requirement: Portuguese is the default locale
The routing configuration SHALL use Portuguese (`br`) as the default locale. When a visitor opens an unprefixed URL with no stored language choice, the locale SHALL be detected from `Accept-Language`, where any `pt` tag (`pt`, `pt-BR`, `pt-PT`, any case) SHALL count as `br`. A visitor whose `Accept-Language` matches neither supported locale SHALL get `br`. A stored choice (the locale cookie) or an explicit `/en` / `/br` prefix SHALL take precedence over detection.

#### Scenario: Brazilian browser that also lists English
- **WHEN** a first-time visitor opens `/` with `Accept-Language: pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7`
- **THEN** they are redirected to `/br` and the UI renders in Portuguese

#### Scenario: Browser with an unsupported language
- **WHEN** a first-time visitor opens `/` with `Accept-Language: es-ES,es;q=0.9`
- **THEN** they are redirected to `/br`

#### Scenario: English browser
- **WHEN** a first-time visitor opens `/` with `Accept-Language: en-US,en;q=0.9`
- **THEN** they are redirected to `/en`

#### Scenario: Stored choice wins over detection
- **WHEN** a visitor who previously switched to English opens `/` with `Accept-Language: pt-BR`
- **THEN** they are redirected to `/en`
