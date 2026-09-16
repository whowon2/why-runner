#!/usr/bin/env node
// Runs drizzle-kit migrate only for Vercel Production builds.
// DATABASE_URL is shared across Production/Preview/Development in this
// project, so an unconditional migrate-on-build would run prod migrations
// against prod DB on every PR preview build too. VERCEL_ENV is set
// automatically by Vercel (production|preview|development) and needs no
// extra config.
import { execSync } from "node:child_process";

if (process.env.VERCEL_ENV === "production" || !process.env.VERCEL_ENV) {
  // No VERCEL_ENV means we're not on Vercel at all (local build, other host) — migrate.
  execSync("drizzle-kit migrate", { stdio: "inherit" });
} else {
  console.log(
    `Skipping migrate: VERCEL_ENV=${process.env.VERCEL_ENV} (not production)`,
  );
}
