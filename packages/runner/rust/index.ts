import { mkdir } from "node:fs/promises";
import { removeDir } from "../src/utils/remove-dir";
import { submissionSchema, type Problem, type Submission } from "../types";

async function run(testDir: string) {
	const command = [
		"docker",
		"run",
		"--rm",
		"-v",
		`${testDir}:/app/data`,
		"runner-rust",
	];

	try {
	} catch (e) {}

	const child = Bun.spawn(command, { stdout: "pipe", stderr: "pipe" });

	const text = await new Response(child.stdout).text();
	const error = await new Response(child.stderr).text();

	if (error) {
		if (error.includes("Unable to find image")) {
			throw new Error("Rust runner container is down");
		}

		console.error(error);
		return error;
	}

	return text;
}

export async function rustJudge(problem: Problem, submission: Submission) {
	const { code } = submissionSchema.parse(submission);

	const result: {
		passed: boolean;
		tests: string[];
	} = {
		passed: true,
		tests: [],
	};

	for (let i = 0; i < problem.inputs.length; i++) {
		const dir = `/tmp/judge-rust-${submission.id}-${i}`;

		await removeDir(dir);
		await mkdir(dir);

		await Bun.write(`${dir}/code.rs`, code);
		await Bun.write(`${dir}/input.txt`, problem.inputs[i]);
		await Bun.write(`${dir}/output.txt`, `${problem.outputs[i]}\n`);

		const res = await run(dir);

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
