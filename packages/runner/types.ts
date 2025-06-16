import { z } from "zod";

export type SubmissionStatus = "RUNNING" | "FAILED" | "PASSED" | "ERROR";

const problemSchema = z.object({
	id: z.string().uuid(),
	inputs: z.array(z.string()),
	outputs: z.array(z.string()),
});

export type Problem = z.infer<typeof problemSchema>;

export const submissionSchema = z.object({
	id: z.string().uuid(),
	code: z.string(),
	problemId: z.string().uuid(),
	language: z.enum(["rust", "cpp"]),
});

export type Submission = z.infer<typeof submissionSchema>;
