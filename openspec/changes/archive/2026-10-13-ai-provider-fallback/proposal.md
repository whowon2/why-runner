## Why

All six AI features (submission hints, algorithm-constraint classification, reference solution, narrative, problem review, tag suggestion) call Gemini directly with no timeout and no fallback. During a Gemini capacity incident (observed 2026-10-13: 500s, 503 "high demand", and requests hanging for 300s) every AI button either errors or spins for five minutes.

## What Changes

- New shared server-only module `web/lib/ai.ts` exposing `generateText` and `generateJson` (zod-schema-validated). All six features call it instead of constructing `GoogleGenAI` themselves.
- Each attempt has a per-attempt timeout (30s) instead of the SDK's multi-minute default.
- On retryable failures (timeout, network error, 404 model-not-found, 429, 5xx, unparsable/invalid JSON) the call falls through an ordered provider chain: primary Gemini model → fallback Gemini model (`gemini-3.5-flash-lite`) → Claude (`claude-haiku-5-5`) when `ANTHROPIC_API_KEY` is configured.
- Non-retryable errors (e.g. 400 bad request, auth errors) fail immediately without trying later providers.
- New optional env var `ANTHROPIC_API_KEY`; new dependency `@anthropic-ai/sdk`. `lib/gemini-model.ts` becomes `lib/ai-models.ts` holding all model ids.
- Per-feature response schemas move from Gemini `Type.*` objects to zod schemas (single source for both providers).

## Capabilities

### New Capabilities
- `ai-provider-fallback`: timeout, retryable-error classification, and provider fallback chain shared by all AI features.

### Modified Capabilities
<!-- None: each AI feature's user-visible requirements are unchanged; only reliability improves. -->

## Impact

- `web/lib/ai.ts` (new), `web/lib/ai-models.ts` (renamed from `gemini-model.ts`), `web/env.ts`.
- Six actions: `lib/actions/get-ai-help.ts`, `lib/actions/lessons/classify-algorithm-requirement.ts`, `lib/actions/problems/{generate-reference-solution,generate-problem-narrative,review-problem,suggest-problem-tags}.ts`.
- Deploy: set `ANTHROPIC_API_KEY` in production env to enable the Claude leg (optional; without it the chain is Gemini-only).
- Cost: fallbacks only fire on failure; Claude Haiku 5.5 is $0.10/$0.50 per MTok.
