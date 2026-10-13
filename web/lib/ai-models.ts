// Model ids for every AI feature, tried in this order by lib/ai.ts. Older
// Gemini ids get retired for new API keys (gemini-2.5-flash 404s on keys
// created after its retirement).
export const GEMINI_MODEL = "gemini-3.5-flash";
// Same generation, separate capacity: often still serves when the main model
// returns 503 "high demand".
export const GEMINI_FALLBACK_MODEL = "gemini-3.5-flash-lite";
// Only used when ANTHROPIC_API_KEY is set; covers a full Gemini outage.
export const CLAUDE_FALLBACK_MODEL = "claude-haiku-5-5";
