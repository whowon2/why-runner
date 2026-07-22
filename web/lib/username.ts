import { z } from "zod";

export const usernameSchema = z
  .string()
  .min(3)
  .max(20)
  .regex(/^[a-z0-9-]+$/, "Username must be lowercase letters, numbers, or -");
