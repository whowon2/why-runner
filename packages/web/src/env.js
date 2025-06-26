import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
	/**
	 * Specify your client-side environment variables schema here. This way you can ensure the app
	 * isn't built with invalid env vars. To expose them to the client, prefix them with
	 * `NEXT_PUBLIC_`.
	 */
	client: {
		// NEXT_PUBLIC_CLIENTVAR: z.string(),
	},
	/**
	 * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
	 * `SOME_VAR=''` will throw an error.
	 */
	emptyStringAsUndefined: true,

	/**
	 * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
	 * middlewares) or client-side so we need to destruct manually.
	 */
	runtimeEnv: {
		AUTH_GITHUB_ID: process.env.AUTH_GITHUB_ID,
		AUTH_GITHUB_SECRET: process.env.AUTH_GITHUB_SECRET,
		AUTH_GOOGLE_ID: process.env.AUTH_GITHUB_ID,
		AUTH_GOOGLE_SECRET: process.env.AUTH_GITHUB_SECRET,
		AUTH_SECRET: process.env.AUTH_SECRET,
		DATABASE_URL: process.env.DATABASE_URL,
		GEMINI_KEY: process.env.GEMINI_KEY,
		NODE_ENV: process.env.NODE_ENV,
		AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
		AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
		AWS_REGION: process.env.AWS_REGION,
		SQS_QUEUE_URL: process.env.SQS_QUEUE_URL,
	},
	/**
	 * Specify your server-side environment variables schema here. This way you can ensure the app
	 * isn't built with invalid env vars.
	 */
	server: {
		AUTH_GITHUB_ID: z.string(),
		AUTH_GITHUB_SECRET: z.string(),
		AUTH_GOOGLE_ID: z.string(),
		AUTH_GOOGLE_SECRET: z.string(),
		AUTH_SECRET:
			process.env.NODE_ENV === 'production'
				? z.string()
				: z.string().optional(),
		DATABASE_URL: z.string().url(),
		GEMINI_KEY: z.string(),
		NODE_ENV: z
			.enum(['development', 'test', 'production'])
			.default('development'),
		AWS_ACCESS_KEY_ID: z.string(),
		AWS_SECRET_ACCESS_KEY: z.string(),
		AWS_REGION: z.string(),
		SQS_QUEUE_URL: z.string(),
	},
	/**
	 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
	 * useful for Docker builds.
	 */
	skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
