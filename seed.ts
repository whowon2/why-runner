import { reset, seed } from "drizzle-seed";
import { db } from "./drizzle/db";
import * as schema from "./drizzle/schema";

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
        id: f.int({
          minValue: 10000,
          maxValue: 100000,
          isUnique: true,
        }),
        name: f.companyName(), // "Acme Corp Contest"
        description: f.loremIpsum({ sentencesCount: 1 }),
        startDate: f.date({ minDate: "2023-01-01", maxDate: "2024-12-31" }),
        // Ensure endDate is handled effectively (random dates usually work, but simple logic is hard in seeders)
        endDate: f.date({ minDate: "2025-01-01", maxDate: "2026-01-01" }),
        createdBy: f.fullName(), // Simple text field in your schema
      },
      with: {
        problemOnContest: 5, // Each contest gets ~5 problems
      },
    },

    // 3. Problems
    problem: {
      count: 10000,
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
          values: [["1 2", "5 10"], ["100"], ["0 0"]],
        }),
        outputs: f.valuesFromArray({ values: [["3", "15"], ["100"], ["0"]] }),
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
        answered: f.valuesFromArray({ values: [["A", "B"], [], ["C"]] }),
      },
    },
  }));

  console.log("✅ Seeding finished!");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seeding failed");
  console.error(err);
  process.exit(1);
});
