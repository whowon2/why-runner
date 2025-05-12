import { z } from "zod";

const envs = z.object({
	REDIS_URL: z.string(),
	PORT: z.number().default(4000),
	JWT_SECRET: z.string(),
});

export function validateEnvs(config: Record<string, unknown>) {
	const validated = envs.parse(config);
	return validated;
}
