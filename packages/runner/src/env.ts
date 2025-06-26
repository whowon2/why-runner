import { z } from "zod";

export const envSchema = z.object({
	REDIS_URL: z.string().url(),
	AWS_ACCESS_KEY_ID: z.string().min(1),
	AWS_SECRET_ACCESS_KEY: z.string().min(1),
	SQS_QUEUE_URL: z.string().url(),
	AWS_REGION: z.string().min(1),
});

export type Env = z.infer<typeof envSchema>;

export const env = envSchema.parse(process.env);
