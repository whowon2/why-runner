import "dotenv/config";
import { db } from "@/drizzle/db";
import { type LessonTheme, lessonTheme } from "@/drizzle/schema";

const LESSON_THEMES: Record<string, LessonTheme[]> = {
  "Even or Odd": ["conditionals"],
  Factorial: ["loops"],
  Fibonacci: ["loops"],
  FizzBuzz: ["loops", "conditionals"],
  "Reverse a String": ["strings"],
  "Count Vowels": ["strings"],
  "Palindrome Check": ["strings", "arrays", "conditionals"],
  "Maximum of an Array": ["arrays"],
};

async function main() {
  const lessons = await db.query.lesson.findMany({ with: { problem: true } });

  for (const l of lessons) {
    const themes = LESSON_THEMES[l.problem.title];
    if (!themes) continue;

    for (const theme of themes) {
      await db
        .insert(lessonTheme)
        .values({ lessonId: l.id, theme })
        .onConflictDoNothing();
    }

    console.log(`Synced themes for [${l.problem.title}]: ${themes.join(", ")}`);
  }
}

main().then(() => process.exit(0));
