import { z } from "zod";

export const signinSchema = z.object({
	email: z.string(),
	password: z.string(),
});

export const signupSchema = z.object({
	email: z.string(),
	password: z.string().min(8),
	name: z.string().min(4),
});

export const updateProfileSchema = z.object({
	name: z.string(),
	image: z.union([z.string().url(), z.literal("")]),
});
