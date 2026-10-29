# ai-provider-fallback Specification

## Purpose
Defines the shared LLM provider chain used by every AI feature: time-bounded attempts, which failures fall through to the next model/provider (Claude Haiku first when configured, then Gemini, then Gemini lite), and logging of failed attempts.
## Requirements
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

### Requirement: Attempts are time-bounded
Each provider attempt SHALL be aborted after 30 seconds and treated as a retryable failure, so a hung provider cannot block a request for minutes.

#### Scenario: Provider hangs
- **WHEN** a provider does not respond within 30 seconds
- **THEN** that attempt SHALL be abandoned and the next provider in the chain SHALL be tried

### Requirement: Only retryable failures fall through
Timeouts, network errors, HTTP 404 (model not found, e.g. a retired model id), HTTP 429, HTTP 5xx, refusals, and responses that fail to parse or validate against the requested schema SHALL be treated as retryable and move to the next provider. Other errors (e.g. HTTP 400, 401, 403) SHALL fail immediately without trying later providers.

#### Scenario: Invalid structured output
- **WHEN** a provider returns JSON that does not match the feature's schema
- **THEN** the next provider SHALL be tried

#### Scenario: Bad request
- **WHEN** a provider returns HTTP 400
- **THEN** the call SHALL fail immediately with that error

### Requirement: Fallbacks are observable
Each failed attempt SHALL be logged server-side with the provider, model, and error, so fallback frequency can be seen in logs.

#### Scenario: Fallback logged
- **WHEN** the primary model fails and the fallback succeeds
- **THEN** a server log entry SHALL record the primary's provider, model and error

