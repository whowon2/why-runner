## Context

Six features each do `new GoogleGenAI(...)` + `generateContent` with `GEMINI_MODEL`. Three use structured JSON (`responseSchema` built from Gemini `Type.*`), three plain text. No timeout is set, so a stalled Gemini request hangs ~300s. No Anthropic key exists in local `.env` today.

## Goals / Non-Goals

**Goals:** bounded latency, survive single-model and whole-Gemini outages, one schema definition per feature usable by both providers, minimal change to call sites.

**Non-Goals:** streaming, cost routing, per-feature model choice, retry-with-backoff on the same model, circuit breaker / remembering a provider is down across requests (revisit if logs show repeated fallbacks).

## Decisions

1. **Own small helper, not Vercel AI SDK / gateway.** App isn't on Vercel; six call sites; a ~150-line module is easier to reason about for the thesis than a framework migration.
2. **Zod as the schema source.** zod v4 `z.toJSONSchema()` feeds Gemini's `responseJsonSchema`; `zodOutputFormat()` from `@anthropic-ai/sdk/helpers/zod` feeds Claude's `output_config.format` via `messages.parse()`. Every result is re-validated with `schema.safeParse` regardless of provider, so call-site defensive parsing collapses to typed access.
3. **Chain:** `gemini-3.5-flash` → `gemini-3.5-flash-lite` → `claude-haiku-5-5` (only if `ANTHROPIC_API_KEY`). Lite model has separate capacity, so it often survives "high demand" on the main model; Claude covers a whole-Google outage. Haiku 5.5 is cheap and supports structured outputs; requests use `output_config.effort: "low"` for JSON classification-style calls and default effort for text.
4. **Timeouts:** 30s per attempt. Gemini via `httpOptions.timeout`; Anthropic client `timeout: 30_000, maxRetries: 0` (the chain is the retry). Worst case ≈ 90s, vs 300s today.
5. **Error classification:** Gemini `ApiError.status` 404/429/5xx → retryable (404 = model id retired/unknown, model-specific); other `ApiError` → fatal; any non-`ApiError` (abort, fetch/network) → retryable. Anthropic: `RateLimitError`, `InternalServerError`, `APIConnectionError` (incl. timeout), status 404 or ≥ 500 → retryable; other `APIError` → fatal. Claude `stop_reason: "refusal"` and parse/validation failures → retryable (move on / give up at end).
6. **Not a server action.** `lib/ai.ts` imports `server-only`-style guard (no `"use server"`), so the generic generate functions are never callable from the browser.

## Risks / Trade-offs

- [Fallback model gives lower-quality output silently] → logged per attempt; lite/Haiku are adequate for these tasks; author always reviews AI output before saving.
- [Gemini rejects some JSON-schema keywords from `z.toJSONSchema`] → schemas kept simple (objects, strings, booleans, enums, arrays); strip `$schema`; verified live per feature.
- [Worst-case latency 90s still long] → acceptable vs 300s; UI already shows pending state.
- [Prompt tuned for Gemini] → prompts are plain instruction text with XML-tagged data; portable to Claude.

## Migration Plan

Add `ANTHROPIC_API_KEY` to production env (optional). Ship. Rollback = revert; no data changes.
