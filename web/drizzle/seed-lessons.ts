import "dotenv/config";
import { readFileSync } from "node:fs";
import path from "node:path";
import { db } from "@/drizzle/db";
import {
  type LessonTheme,
  lesson,
  lessonTheme,
  lessonThemeRequirement,
  problem,
} from "@/drizzle/schema";
import { generateProblemCode } from "@/lib/problem-code";
import { generateSlug } from "@/lib/slug";

interface SeedProblem {
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  exampleCount: number;
  inputs: string[];
  outputs: string[];
}

const LESSON_MAP: Record<
  string,
  {
    themes: LessonTheme[];
    order: number;
    requirements?: { theme: LessonTheme; minValue: number }[];
  }
> = {
  "Even or Odd": { themes: ["conditionals"], order: 0 },
  Factorial: { themes: ["loops"], order: 0 },
  Fibonacci: { themes: ["loops"], order: 1 },
  FizzBuzz: { themes: ["loops", "conditionals"], order: 2 },
  "Reverse a String": { themes: ["strings"], order: 0 },
  "Count Vowels": { themes: ["strings"], order: 1 },
  "Palindrome Check": {
    themes: ["strings", "arrays", "conditionals"],
    order: 2,
    requirements: [
      { theme: "strings", minValue: 20 },
      { theme: "arrays", minValue: 15 },
    ],
  },
  "Maximum of an Array": { themes: ["arrays"], order: 0 },
};

async function main() {
  const problemsPath = path.resolve(__dirname, "../../problems.json");
  const problems: SeedProblem[] = JSON.parse(
    readFileSync(problemsPath, "utf-8"),
  );

  for (const p of problems) {
    const mapping = LESSON_MAP[p.title];
    if (!mapping) continue;

    const [createdProblem] = await db
      .insert(problem)
      .values({
        title: p.title,
        slug: generateSlug(p.title),
        code: await generateProblemCode(),
        description: p.description,
        difficulty: p.difficulty,
        createdBy: "system",
        inputs: p.inputs,
        outputs: p.outputs,
        exampleCount: p.exampleCount,
      })
      .returning();

    const [createdLesson] = await db
      .insert(lesson)
      .values({
        problemId: createdProblem.id,
        order: mapping.order,
        primaryLanguage: null,
      })
      .returning();

    await db.insert(lessonTheme).values(
      mapping.themes.map((theme) => ({
        lessonId: createdLesson.id,
        theme,
      })),
    );

    if (mapping.requirements?.length) {
      await db.insert(lessonThemeRequirement).values(
        mapping.requirements.map((req) => ({
          lessonId: createdLesson.id,
          theme: req.theme,
          minValue: req.minValue,
        })),
      );
    }

    console.log(`Seeded lesson: [${mapping.themes.join(", ")}] ${p.title}`);
  }
}

main().then(() => process.exit(0));
