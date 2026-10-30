"use server";

import { customRunsEnabled } from "@/lib/judge";

/**
 * Whether editors should offer "Run with custom input" (the deploy gate;
 * contests also check their own `allowRuns`). Public, no data exposed.
 */
export async function getRunsEnabled() {
  return customRunsEnabled();
}
