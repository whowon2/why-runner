import { pgEnum } from "drizzle-orm/pg-core";

// Own module (re-exported by `submissions.ts`) so `users.ts` can use it for
// `problem_on_contest.allowed_languages` without an import cycle through
// `submissions.ts` → `users.ts`. Keep in sync with `judge/src/models.rs`.
export const Language = pgEnum("language", [
  "c",
  "cpp",
  "java",
  "python",
  "portugol",
  "rust",
]);

export type Language = (typeof Language.enumValues)[number];
