## 1. Foundation

- [x] 1.1 Add `@anthropic-ai/sdk` dependency; add optional `ANTHROPIC_API_KEY` to `web/env.ts`
- [x] 1.2 Rename `lib/gemini-model.ts` → `lib/ai-models.ts` with `GEMINI_MODEL`, `GEMINI_FALLBACK_MODEL`, `CLAUDE_FALLBACK_MODEL`
- [x] 1.3 Implement `lib/ai.ts`: `generateText({ system, prompt })`, `generateJson({ system, prompt, schema })`, provider chain, 30s timeouts, retryable classification, per-attempt logging; not a server action

## 2. Migrate call sites

- [x] 2.1 `get-ai-help.ts` → `generateText`
- [x] 2.2 `generate-reference-solution.ts` → `generateText`
- [x] 2.3 `generate-problem-narrative.ts` → `generateText`
- [x] 2.4 `classify-algorithm-requirement.ts` → `generateJson` with zod schema
- [x] 2.5 `review-problem.ts` → `generateJson` with zod schema
- [x] 2.6 `suggest-problem-tags.ts` → `generateJson` with zod enum schema
- [x] 2.7 No remaining `GoogleGenAI` imports outside `lib/ai.ts`; update `web/CLAUDE.md` AI notes

## 3. Verification

- [x] 3.1 Typecheck + oxlint on changed files
- [x] 3.2 Live: each JSON schema accepted by Gemini (or fallback) and validated
- [x] 3.3 Live: forced primary failure (bogus model id) falls through to the next provider and logs the attempt
- [x] 3.4 Live: Claude leg once `ANTHROPIC_API_KEY` is set
