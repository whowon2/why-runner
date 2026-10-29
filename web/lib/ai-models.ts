// Model ids for every AI feature, tried in this order by lib/ai.ts.
// Claude goes first (only when ANTHROPIC_API_KEY is set): Gemini returned
// 503 "high demand" often enough in class that waiting on it first made AI
// help feel broken.
export const CLAUDE_MODEL = "claude-haiku-5-5";
// Older Gemini ids get retired for new API keys (gemini-2.5-flash 404s on
// keys created after its retirement).
export const GEMINI_FALLBACK_MODEL = "gemini-3.5-flash";
// Same generation, separate capacity: often still serves when the main
// Gemini model returns 503 "high demand".
export const GEMINI_LITE_FALLBACK_MODEL = "gemini-3.5-flash-lite";
