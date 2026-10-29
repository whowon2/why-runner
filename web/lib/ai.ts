// Shared LLM entry point for every AI feature. Deliberately NOT a "use server"
// module: these generic generate functions must never be callable from the
// browser — only from server actions that do their own auth checks.
//
// Each call walks a provider chain (see lib/ai-models.ts) and returns the
// first valid result. Every attempt is time-bounded; only retryable failures
// (timeouts, network errors, 404/429/5xx, refusals, invalid structured output)
// move on to the next provider — anything else (400, auth) fails immediately.

import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { ApiError, GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { env } from "@/env";
import {
  CLAUDE_MODEL,
  GEMINI_FALLBACK_MODEL,
  GEMINI_LITE_FALLBACK_MODEL,
} from "@/lib/ai-models";

const ATTEMPT_TIMEOUT_MS = 30_000;
const CLAUDE_MAX_TOKENS = 16_000;

type Provider = "gemini" | "claude";
type Attempt = { provider: Provider; model: string };

type GenerateInput = {
  system: string;
  prompt: string;
};

/** Failure that should move on to the next provider in the chain. */
class RetryableAiError extends Error {}

function chain(): Attempt[] {
  const attempts: Attempt[] = [];
  if (env.ANTHROPIC_API_KEY) {
    attempts.push({ provider: "claude", model: CLAUDE_MODEL });
  }
  attempts.push(
    { provider: "gemini", model: GEMINI_FALLBACK_MODEL },
    { provider: "gemini", model: GEMINI_LITE_FALLBACK_MODEL },
  );
  return attempts;
}

let gemini: GoogleGenAI | undefined;
let claude: Anthropic | undefined;

function geminiClient() {
  gemini ??= new GoogleGenAI({ apiKey: env.GEMINI_KEY });
  return gemini;
}

function claudeClient() {
  // maxRetries 0: the provider chain is the retry strategy.
  claude ??= new Anthropic({
    apiKey: env.ANTHROPIC_API_KEY,
    timeout: ATTEMPT_TIMEOUT_MS,
    maxRetries: 0,
  });
  return claude;
}

function isRetryable(error: unknown): boolean {
  if (error instanceof RetryableAiError) return true;
  // 404 is model-specific (e.g. a retired model id), so the next model may work.
  if (error instanceof ApiError) {
    return [404, 429].includes(error.status) || error.status >= 500;
  }
  if (error instanceof Anthropic.APIConnectionError) return true; // incl. timeouts
  if (error instanceof Anthropic.APIError) {
    const status = error.status ?? 0;
    return [404, 429].includes(status) || status >= 500;
  }
  // Aborts (our timeout) and raw fetch/network failures.
  return true;
}

async function runChain<T>(
  feature: string,
  run: (attempt: Attempt) => Promise<T>,
): Promise<T> {
  const attempts = chain();
  let lastError: unknown;

  for (const attempt of attempts) {
    try {
      return await run(attempt);
    } catch (error) {
      lastError = error;
      console.warn(
        `[ai] ${feature}: ${attempt.provider}/${attempt.model} failed:`,
        error instanceof Error ? error.message : error,
      );
      if (!isRetryable(error)) break;
    }
  }

  // Raw provider errors (often JSON bodies) are logged above; the caller only
  // ever sees a message fit for a toast.
  throw new Error(
    isRetryable(lastError)
      ? "The AI service is busy right now. Please try again in a few moments."
      : "The AI request could not be completed. Please try again later.",
  );
}

function geminiConfig(system: string) {
  return {
    systemInstruction: system,
    abortSignal: AbortSignal.timeout(ATTEMPT_TIMEOUT_MS),
  };
}

function claudeText(message: Anthropic.Message): string {
  if (message.stop_reason === "refusal") {
    throw new RetryableAiError("Claude declined the request.");
  }
  return message.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");
}

/** Free-form text generation. `feature` labels log lines only. */
export async function generateText(
  feature: string,
  { system, prompt }: GenerateInput,
): Promise<string> {
  return runChain(feature, async ({ provider, model }) => {
    if (provider === "gemini") {
      const response = await geminiClient().models.generateContent({
        model,
        config: geminiConfig(system),
        contents: prompt,
      });
      return response.text ?? "";
    }

    const message = await claudeClient().messages.create({
      model,
      max_tokens: CLAUDE_MAX_TOKENS,
      system,
      messages: [{ role: "user", content: prompt }],
    });
    return claudeText(message);
  });
}

/**
 * Structured JSON generation. The same zod schema constrains both providers'
 * output and re-validates every response, so callers get typed data or an
 * error — never a half-parsed object.
 */
export async function generateJson<Schema extends z.ZodType>(
  feature: string,
  { system, prompt, schema }: GenerateInput & { schema: Schema },
): Promise<z.infer<Schema>> {
  const { $schema: _, ...jsonSchema } = z.toJSONSchema(schema);

  return runChain(feature, async ({ provider, model }) => {
    let raw: unknown;

    if (provider === "gemini") {
      const response = await geminiClient().models.generateContent({
        model,
        config: {
          ...geminiConfig(system),
          responseMimeType: "application/json",
          responseJsonSchema: jsonSchema,
        },
        contents: prompt,
      });
      try {
        raw = JSON.parse(response.text ?? "");
      } catch {
        throw new RetryableAiError("Response was not valid JSON.");
      }
    } else {
      const message = await claudeClient().messages.parse({
        model,
        max_tokens: CLAUDE_MAX_TOKENS,
        system,
        messages: [{ role: "user", content: prompt }],
        output_config: { format: zodOutputFormat(schema) },
      });
      if (message.stop_reason === "refusal") {
        throw new RetryableAiError("Claude declined the request.");
      }
      raw = message.parsed_output;
    }

    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      throw new RetryableAiError(
        `Response did not match schema: ${parsed.error.issues[0]?.message}`,
      );
    }
    return parsed.data;
  });
}
