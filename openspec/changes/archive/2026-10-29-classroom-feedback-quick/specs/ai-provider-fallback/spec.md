## MODIFIED Requirements

### Requirement: AI calls go through a shared provider chain
Every server-side LLM call SHALL go through a shared module that tries an ordered chain of providers/models: Claude Haiku 5.5 first when an Anthropic API key is configured, then the primary Gemini model, then the lighter Gemini fallback model. The first successful result SHALL be returned. The module SHALL NOT be exposed as a server action. Model id constants SHALL be named after their provider and role in the chain, not after a "fallback" role they no longer have.

#### Scenario: Primary succeeds
- **WHEN** `ANTHROPIC_API_KEY` is set and Claude returns a valid response
- **THEN** that response SHALL be returned and no Gemini model SHALL be called

#### Scenario: Primary overloaded
- **WHEN** `ANTHROPIC_API_KEY` is set and Claude returns 529 or 5xx
- **THEN** the system SHALL try the primary Gemini model, and on its failure the lighter Gemini model, returning the first valid response

#### Scenario: Claude not configured
- **WHEN** `ANTHROPIC_API_KEY` is not set
- **THEN** the chain SHALL start at the primary Gemini model, and the call SHALL fail with an error if both Gemini models fail with retryable errors
