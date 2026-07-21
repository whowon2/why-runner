import "dotenv/config";
import { readFileSync } from "node:fs";
import path from "node:path";
import { db } from "@/drizzle/db";
import { type LessonTheme, lesson, problem } from "@/drizzle/schema";
import { generateSlug } from "@/lib/slug";

interface SeedProblem {
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  exampleCount: number;
  inputs: string[];
  outputs: string[];
}

const LESSON_MAP: Record<string, { theme: LessonTheme; order: number }> = {
  "Even or Odd": { theme: "conditionals", order: 0 },
  Factorial: { theme: "loops", order: 0 },
  Fibonacci: { theme: "loops", order: 1 },
  FizzBuzz: { theme: "loops", order: 2 },
  "Reverse a String": { theme: "strings", order: 0 },
  "Count Vowels": { theme: "strings", order: 1 },
  "Palindrome Check": { theme: "strings", order: 2 },
  "Maximum of an Array": { theme: "arrays", order: 0 },
};

async function main() {
  const problemsPath = path.resolve(__dirname, "../../problems.json");
  const problems: SeedProblem[] = JSON.parse(readFileSync(problemsPath, "utf-8"));

  for (const p of problems) {
    const mapping = LESSON_MAP[p.title];
    if (!mapping) continue;

    const [createdProblem] = await db
      .insert(problem)
      .values({
        title: p.title,
        slug: generateSlug(p.title),
        description: p.description,
        difficulty: p.difficulty,
        createdBy: "system",
        inputs: p.inputs,
        outputs: p.outputs,
        exampleCount: p.exampleCount,
      })
      .returning();

    await db.insert(lesson).values({
      problemId: createdProblem.id,
      theme: mapping.theme,
      order: mapping.order,
      primaryLanguage: null,
    });

    console.log(`Seeded lesson: [${mapping.theme}] ${p.title}`);
  }
}

main().then(() => process.exit(0));
