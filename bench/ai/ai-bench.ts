// Benchmark 10: latency of every AI feature, with the app's real prompts
// (lib/prompt.ts) through the app's real provider chain (lib/ai.ts), and how
// often the chain fell through to a fallback model. Ten calls per feature
// (twenty for reference solutions: Python + C), all counted in the output.
// Reference solutions are saved for grading by bench/ai/grade-reference.py.
//   cd web && bun ../bench/ai/ai-bench.ts      (uses web/.env keys)
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { PROBLEM_TAGS } from "@/drizzle/schema";
import { generateJson, generateText } from "@/lib/ai";
import { CLAUDE_MODEL, GEMINI_FALLBACK_MODEL, GEMINI_LITE_FALLBACK_MODEL } from "@/lib/ai-models";
import {
  getNarrativePrompt,
  getProblemReviewPrompt,
  getReferenceSolutionPrompt,
  getTagSuggestionPrompt,
  getUserPrompt,
  SYSTEM_INSTRUCTION,
  SYSTEM_INSTRUCTION_NARRATIVE,
  SYSTEM_INSTRUCTION_PROBLEM_REVIEW,
  SYSTEM_INSTRUCTION_REFERENCE_SOLUTION,
  SYSTEM_INSTRUCTION_TAG_SUGGESTION,
} from "@/lib/prompt";

const root = join(import.meta.dir, "..", "..");
// Same order as lib/ai.ts chain(): Claude only runs when its key is set.
const CHAIN = [
  ...(process.env.ANTHROPIC_API_KEY ? [CLAUDE_MODEL] : []),
  GEMINI_FALLBACK_MODEL,
  GEMINI_LITE_FALLBACK_MODEL,
];
type P = { title: string; description: string; difficulty: string; inputs: string[]; outputs: string[] };
const problems: P[] = JSON.parse(readFileSync(join(root, "problems.json"), "utf8"));
const failures: { problem: P; code: string; language: string; output: string }[] = JSON.parse(
  readFileSync(join(import.meta.dir, "hint-cases.json"), "utf8"),
);

// lib/ai.ts logs one warning per failed attempt: that is the fallback count.
let failedAttempts: string[] = [];
const warn = console.warn;
console.warn = (...args: unknown[]) => {
  failedAttempts.push(String(args[0]));
  warn(...args);
};

const rows = ["feature,item,ms,model,failed_attempts,ok,chars"];
const solutions: { problem: number; language: string; code: string }[] = [];

async function measure(feature: string, item: string, call: () => Promise<string>) {
  failedAttempts = [];
  const t0 = performance.now();
  let ok = true;
  let out = "";
  try {
    out = await call();
  } catch (e) {
    ok = false;
    out = String(e);
  }
  const ms = performance.now() - t0;
  const model = ok ? CHAIN[failedAttempts.length] ?? "?" : "none";
  rows.push(`${feature},${item},${ms.toFixed(0)},${model},${failedAttempts.length},${ok},${out.length}`);
  console.log(feature, item, `${(ms / 1000).toFixed(1)}s`, model, ok ? "" : out);
  return out;
}

const stripCodeFence = (text: string) => {
  const trimmed = text.trim();
  const match = trimmed.match(/^```[^\n]*\n([\s\S]*?)\n?```$/);
  return match ? match[1] : trimmed;
};

const ReviewSchema = z.object({
  descriptionFeedback: z.string(),
  edgeCases: z.array(z.object({ input: z.string(), output: z.string(), rationale: z.string() })),
});

for (const [i, p] of problems.entries()) {
  const problem = p as never;
  await measure("narrative", `p${i}`, () =>
    generateText("narrative", { system: SYSTEM_INSTRUCTION_NARRATIVE, prompt: getNarrativePrompt({ problem }) }),
  );
  await measure("tags", `p${i}`, async () =>
    JSON.stringify(
      await generateJson("tag-suggestion", {
        system: SYSTEM_INSTRUCTION_TAG_SUGGESTION,
        prompt: getTagSuggestionPrompt({ title: p.title, description: p.description, allowedTags: PROBLEM_TAGS }),
        schema: z.object({ tags: z.array(z.enum(PROBLEM_TAGS)) }),
      }),
    ),
  );
  await measure("review", `p${i}`, async () =>
    JSON.stringify(
      await generateJson("problem-review", {
        system: SYSTEM_INSTRUCTION_PROBLEM_REVIEW,
        prompt: getProblemReviewPrompt({ problem }),
        schema: ReviewSchema,
      }),
    ),
  );
  for (const language of ["python", "c"] as const) {
    const code = await measure("reference-solution", `p${i}-${language}`, async () =>
      stripCodeFence(
        await generateText("reference-solution", {
          system: SYSTEM_INSTRUCTION_REFERENCE_SOLUTION,
          prompt: getReferenceSolutionPrompt({ problem, language }),
        }),
      ),
    );
    solutions.push({ problem: i, language, code });
  }
}

for (const [i, f] of failures.entries()) {
  await measure("explain-hint", `h${i}`, () =>
    generateText("ai-help", {
      system: SYSTEM_INSTRUCTION,
      prompt: getUserPrompt({
        submission: { code: f.code, language: f.language, output: f.output, editorMode: "code" } as never,
        problem: f.problem as never,
        locale: "br",
        level: i % 2 ? "hint" : undefined,
      }),
    }),
  );
}

writeFileSync(join(root, "bench/results/ai_calls.csv"), `${rows.join("\n")}\n`);
writeFileSync(join(import.meta.dir, "reference-solutions.json"), JSON.stringify(solutions, null, 1));
