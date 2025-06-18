import { mkdir } from "node:fs/promises";
import { type Problem, type Submission, submissionSchema } from "../types";
import { removeDir } from "./utils/remove-dir";

async function run(dir: string, language: "rust" | "cpp") {
	const command = [`./src/${language}-run.sh`, dir];

	console.log({command})

	const child = Bun.spawn(command, { stdout: "pipe", stderr: "pipe" });

	const text = await new Response(child.stdout).text();
	const error = await new Response(child.stderr).text();

	if (error) {
		console.error(error);
		return error;
	}

	return text;
}

export async function judge(problem: Problem, submission: Submission) {
  const extensions = {
    "rust": "rs",
    "cpp": "cpp"
  }

	const { code } = submissionSchema.parse(submission);

	const result: {
		passed: boolean;
		tests: string[];
	} = {
		passed: true,
		tests: [],
	};

	const extension = extensions[submission.language]

	for (let i = 0; i < problem.inputs.length; i++) {
		const dir = `./src/judge-${submission.language}-${submission.id}-${i}`;

		await removeDir(dir);
		await mkdir(dir);

		await Bun.write(`${dir}/code.${extension}`, code);
		await Bun.write(`${dir}/input.txt`, problem.inputs[i]);
		await Bun.write(`${dir}/output.txt`, `${problem.outputs[i]}\n`);

		const res = await run(dir, submission.language);

		result.tests.push(res.trim());

		if (res.trim() !== "pass") {
			// console.log(res);
			result.passed = false;
			break;
		}

		await removeDir(dir);
	}

	return result;
}
