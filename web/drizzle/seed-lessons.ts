import "dotenv/config";
import { readFileSync } from "node:fs";
import path from "node:path";
import { db } from "@/drizzle/db";
import { classroom, lesson, lessonTrack, problem } from "@/drizzle/schema";
import { generateClassCode } from "@/lib/class-code";
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

const LESSON_MAP: Record<string, { order: number }> = {
  "Even or Odd": { order: 0 },
  Factorial: { order: 1 },
  Fibonacci: { order: 2 },
  FizzBuzz: { order: 3 },
  "Reverse a String": { order: 4 },
  "Count Vowels": { order: 5 },
  "Palindrome Check": { order: 6 },
  "Maximum of an Array": { order: 7 },
};

async function main() {
  const problemsPath = path.resolve(__dirname, "../../problems.json");
  const problems: SeedProblem[] = JSON.parse(
    readFileSync(problemsPath, "utf-8"),
  );

  const [defaultClass] = await db
    .insert(classroom)
    .values({
      name: "Sample Class",
      slug: generateSlug("sample-class"),
      joinCode: generateClassCode(),
      createdBy: "system",
    })
    .returning();

  const [defaultTrack] = await db
    .insert(lessonTrack)
    .values({
      title: "Roadmap",
      slug: generateSlug("roadmap"),
      classroomId: defaultClass.id,
      isPublished: true,
      createdBy: "system",
    })
    .returning();

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

    await db.insert(lesson).values({
      trackId: defaultTrack.id,
      problemId: createdProblem.id,
      slug: generateSlug(p.title),
      order: mapping.order,
      primaryLanguage: null,
    });

    console.log(`Seeded lesson #${mapping.order}: ${p.title}`);
  }

  console.log(`Class join code: ${defaultClass.joinCode}`);
}

main().then(() => process.exit(0));
