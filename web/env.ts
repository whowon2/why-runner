import { createEnv } from "@t3-oss/env-nextjs";
import z from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.url(),
    GEMINI_KEY: z.string().min(1),
    // Optional: enables Claude as the last AI fallback (see lib/ai.ts).
    ANTHROPIC_API_KEY: z.string().min(1).optional(),
    GITHUB_ID: z.string().min(1),
    GITHUB_SECRET: z.string().min(1),
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    BLOB_READ_WRITE_TOKEN: z.string().min(1),
    RESEND_API_KEY: z.string().min(1).optional(),
    EMAIL_FROM: z.string().min(1).optional(),
    // Optional: lets submissions wake the idle-stopped Fly judge (lib/judge.ts).
    FLY_API_TOKEN: z.string().min(1).optional(),
    FLY_JUDGE_APP: z.string().min(1).default("why-runner-judge"),
    // Optional: comma-separated emails allowed to see evaluation survey
    // results (lib/surveys/admin.ts). Unset = nobody.
    SURVEY_ADMIN_EMAILS: z.string().optional(),
    // Optional: comma-separated emails that may open read-only previews of
    // every survey form (/surveys/preview/[form]). Admins always can.
    SURVEY_PREVIEW_EMAILS: z.string().optional(),
  },
  client: {},
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    GEMINI_KEY: process.env.GEMINI_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    GITHUB_ID: process.env.GITHUB_ID,
    GITHUB_SECRET: process.env.GITHUB_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
    FLY_API_TOKEN: process.env.FLY_API_TOKEN,
    FLY_JUDGE_APP: process.env.FLY_JUDGE_APP,
    SURVEY_ADMIN_EMAILS: process.env.SURVEY_ADMIN_EMAILS,
    SURVEY_PREVIEW_EMAILS: process.env.SURVEY_PREVIEW_EMAILS,
  },
});
