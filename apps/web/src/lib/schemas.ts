import { z } from "zod";

export const loginSchema = z.object({
  email: z.string(),
  password: z.string(),
});

export const updateProfileSchema = z.object({
  name: z.string(),
  image: z.union([z.string().url(), z.literal("")]),
});
