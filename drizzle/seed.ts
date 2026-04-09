import { reset, seed } from "drizzle-seed";
import { db } from "@/drizzle/db";
import * as schema from "@/drizzle/schema";

async function main() {
  console.log("⏳ Resetting database...");
  await reset(db, schema);

  console.log("🌱 Seeding database...");

  await seed(db, schema).refine((f) => ({
    // 1. Users
    user: {
      count: 50,
      columns: {
        id: f.uuid(), // Generates unique string IDs
        name: f.fullName(),
        email: f.email(),
        image: f.valuesFromArray({
          values: ["https://github.com/shadcn.png"],
        }),
        bio: f.loremIpsum({ sentencesCount: 3 }),
        createdAt: f.date({ maxDate: new Date().toISOString() }),
      },
      // Generate related entries
      with: {
        userOnContest: 2, // Each user joins ~2 contests
      },
    },

    // 2. Contests
    contest: {
      count: 10,
      columns: {
        id: f.uuid(),
        name: f.companyName(), // "Acme Corp Contest"
        description: f.loremIpsum({ sentencesCount: 1 }),
        startDate: f.date({ minDate: "2023-01-01", maxDate: "2024-12-31" }),
        // Ensure endDate is handled effectively (random dates usually work, but simple logic is hard in seeders)
        endDate: f.date({ minDate: "2025-01-01", maxDate: "2026-01-01" }),
        createdBy: f.fullName(), // Simple text field in your schema
        createdAt: f.date({ maxDate: new Date().toISOString() }),
      },
      with: {
        problemOnContest: 5, // Each contest gets ~5 problems
      },
    },

    // 3. Problems
    problem: {
      count: 1,
      columns: {
        title: f.loremIpsum({ sentencesCount: 1 }),
        description: f.loremIpsum({ sentencesCount: 3 }),
        // Drizzle Seed detects Enums automatically, but we can weight them:
        difficulty: f.weightedRandom([
          { weight: 0.5, value: f.valuesFromArray({ values: ["easy"] }) },
          { weight: 0.3, value: f.valuesFromArray({ values: ["medium"] }) },
          { weight: 0.2, value: f.valuesFromArray({ values: ["hard"] }) },
        ]),
        // Handling Arrays
        inputs: f.valuesFromArray({
          values: [["1 2", "5 10"], ["100"], ["0 0"]] as unknown as string[],
        }),
        outputs: f.valuesFromArray({
          values: [["3", "15"], ["100"], ["0"]] as unknown as string[],
        }),
      },
    },

    // 4. Submissions
    submission: {
      count: 200,
      columns: {
        code: f.valuesFromArray({
          values: [
            'print("Hello World")',
            'console.log("Test")',
            "#include <stdio.h>",
          ],
        }),
        language: f.valuesFromArray({
          values: ["python", "c", "cpp", "rust", "java"],
        }),
        status: f.weightedRandom([
          {
            weight: 0.1,
            value: f.valuesFromArray({ values: ["PENDING", "RUNNING"] }),
          },
          { weight: 0.5, value: f.valuesFromArray({ values: ["PASSED"] }) },
          {
            weight: 0.4,
            value: f.valuesFromArray({ values: ["FAILED", "ERROR"] }),
          },
        ]),
        questionLetter: f.valuesFromArray({
          values: ["A", "B", "C", "D", "E"],
        }),
      },
    },

    // 5. Join Tables (Refining explicit table columns if needed)
    userOnContest: {
      columns: {
        answered: f.valuesFromArray({
          values: [["A", "B"], [], ["C"]] as unknown as string[],
        }),
      },
    },
  }));

  console.log("⚡ Creating a specific contest to join in 1 minute...");
  const now = new Date();
  const start = new Date(now.getTime() + 60 * 1000); // starts in 1 min
  const end = new Date(start.getTime() + 60 * 60 * 1000); // ends in 1 hour

  const [specificContest] = await db
    .insert(schema.contest)
    .values({
      name: "Quick Join Contest",
      description: "A contest created just for you to join right now!",
      startDate: start,
      endDate: end,
      createdBy: "Admin",
      createdAt: now,
    })
    .returning();

  console.log("📝 Adding 'Two Sum' problem to the contest...");
  const [twoSum] = await db
    .insert(schema.problem)
    .values({
      title: "Two Sum",
      description: "Given two integers separated by a space, print their sum.",
      difficulty: "easy",
      inputs: ["1 2", "5 10", "100 200", "-5 5"],
      outputs: ["3", "15", "300", "0"],
      createdBy: "Admin",
    })
    .returning();

  await db.insert(schema.problemOnContest).values({
    contestId: specificContest.id,
    problemId: twoSum.id,
  });

  console.log("✅ Seeding finished!");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seeding failed");
  console.error(err);
  process.exit(1);
});
