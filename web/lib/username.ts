import { z } from "zod";

export const usernameSchema = z
  .string()
  .min(3)
  .max(20)
  .regex(
    /^[a-z0-9.-]+$/,
    "Username must be lowercase letters, numbers, . or -",
  );

export function generateUsername(seed: string): string {
  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const base = (seed.toLowerCase().replace(/[^a-z0-9.]+/g, "") || "user").slice(
    0,
    20 - suffix.length - 1,
  );
  return `${base}-${suffix}`;
}
