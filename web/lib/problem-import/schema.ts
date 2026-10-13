import { z } from "zod";
import { PROBLEM_TAGS, ProblemDifficulty } from "@/drizzle/schemas/problems";

// Shared by the import dialog (client-side preview) and the importProblems
// server action (authoritative validation), so both report the same errors.

export const TIME_LIMIT_MS = { min: 100, max: 10_000, default: 1000 } as const;
export const MEMORY_LIMIT_MB = { min: 16, max: 1024, default: 512 } as const;

export const problemImportSchema = z
  .strictObject({
    title: z.string().trim().min(1, "Required"),
    description: z.string().trim().min(1, "Required"),
    difficulty: z.enum(ProblemDifficulty.enumValues).nullable().optional(),
    tags: z
      .array(
        z.enum(PROBLEM_TAGS, {
          error: (iss) => `invalid tag ${JSON.stringify(iss.input)}`,
        }),
      )
      .default([])
      .transform((tags) => [...new Set(tags)]),
    exampleCount: z.number().int().min(1).default(1),
    inputs: z.array(z.string()).min(1, "At least one test case is required"),
    outputs: z.array(z.string()).min(1, "At least one test case is required"),
    narrative: z.string().optional(),
    timeLimitMs: z
      .number()
      .int()
      .min(TIME_LIMIT_MS.min)
      .max(TIME_LIMIT_MS.max)
      .default(TIME_LIMIT_MS.default),
    memoryLimitMb: z
      .number()
      .int()
      .min(MEMORY_LIMIT_MB.min)
      .max(MEMORY_LIMIT_MB.max)
      .default(MEMORY_LIMIT_MB.default),
  })
  .superRefine((p, ctx) => {
    if (p.outputs.length !== p.inputs.length) {
      ctx.addIssue({
        code: "custom",
        path: ["outputs"],
        message: `expected ${p.inputs.length} items to match inputs, got ${p.outputs.length}`,
      });
    }
    if (p.exampleCount > p.inputs.length) {
      ctx.addIssue({
        code: "custom",
        path: ["exampleCount"],
        message: `must be at most the number of test cases (${p.inputs.length})`,
      });
    }
  });

export type ProblemImport = z.infer<typeof problemImportSchema>;

/** Accepts either a bare array or `{ "problems": [...] }`. */
export function unwrapImportPayload(data: unknown): unknown {
  if (
    data !== null &&
    typeof data === "object" &&
    !Array.isArray(data) &&
    "problems" in data
  ) {
    return (data as { problems: unknown }).problems;
  }
  return data;
}

export const importPayloadSchema = z.preprocess(
  unwrapImportPayload,
  z
    .array(problemImportSchema, {
      error: 'Expected an array of problems or { "problems": [...] }',
    })
    .min(1, "File contains no problems"),
);

export type ImportIssue = {
  /** 0-based problem index; undefined for root-level issues. */
  index?: number;
  title?: string;
  field: string;
  message: string;
};

function formatPath(path: PropertyKey[]): string {
  return path.reduce<string>((acc, key) => {
    if (typeof key === "number") return `${acc}[${key}]`;
    return acc ? `${acc}.${String(key)}` : String(key);
  }, "");
}

export function formatImportIssues(
  issues: z.core.$ZodIssue[],
  rawData: unknown,
): ImportIssue[] {
  const raw = unwrapImportPayload(rawData);
  return issues.map((issue) => {
    const [head, ...rest] = issue.path;
    const message =
      issue.code === "unrecognized_keys"
        ? `unrecognized ${issue.keys.length === 1 ? "key" : "keys"} ${issue.keys.map((k) => `"${k}"`).join(", ")}`
        : issue.message;
    if (typeof head !== "number") {
      return { field: formatPath(issue.path), message };
    }
    const entry = Array.isArray(raw) ? raw[head] : undefined;
    const title =
      entry && typeof entry === "object" && "title" in entry
        ? entry.title
        : undefined;
    return {
      index: head,
      title: typeof title === "string" && title.trim() ? title : undefined,
      field: formatPath(rest),
      message,
    };
  });
}

export type ParseImportResult =
  | { ok: true; problems: ProblemImport[] }
  | { ok: false; errors: ImportIssue[] };

export function parseImportPayload(data: unknown): ParseImportResult {
  const parsed = importPayloadSchema.safeParse(data);
  if (parsed.success) return { ok: true, problems: parsed.data };
  return { ok: false, errors: formatImportIssues(parsed.error.issues, data) };
}

export type ImportFieldDoc = {
  name: keyof ProblemImport;
  type: string;
  required: boolean;
  default?: string;
  values?: readonly string[];
};

export const IMPORT_FIELDS: ImportFieldDoc[] = [
  { name: "title", type: "string", required: true },
  { name: "description", type: "string (Markdown)", required: true },
  { name: "inputs", type: "string[]", required: true },
  { name: "outputs", type: "string[]", required: true },
  {
    name: "difficulty",
    type: "string",
    required: false,
    values: ProblemDifficulty.enumValues,
  },
  { name: "tags", type: "string[]", required: false, default: "[]", values: PROBLEM_TAGS },
  { name: "exampleCount", type: "integer", required: false, default: "1" },
  { name: "narrative", type: "string (Markdown)", required: false },
  {
    name: "timeLimitMs",
    type: `integer (${TIME_LIMIT_MS.min}–${TIME_LIMIT_MS.max})`,
    required: false,
    default: String(TIME_LIMIT_MS.default),
  },
  {
    name: "memoryLimitMb",
    type: `integer (${MEMORY_LIMIT_MB.min}–${MEMORY_LIMIT_MB.max})`,
    required: false,
    default: String(MEMORY_LIMIT_MB.default),
  },
];

export const IMPORT_TEMPLATE = {
  problems: [
    {
      title: "Sum of Two Numbers",
      description:
        "Read two integers A and B on a single line and print A + B.\n\n**Input:** Two integers A and B (−10⁹ ≤ A, B ≤ 10⁹).\n\n**Output:** A single integer: A + B.",
      difficulty: "easy",
      tags: ["input-output", "math"],
      exampleCount: 2,
      inputs: ["3 5", "100 200", "-7 3"],
      outputs: ["8", "300", "-4"],
      narrative: "Ana is counting apples from two baskets…",
      timeLimitMs: 1000,
      memoryLimitMb: 256,
    },
    {
      title: "Hello World",
      description: "Print `Hello, World!` exactly as shown.",
      inputs: [""],
      outputs: ["Hello, World!"],
    },
  ],
};
