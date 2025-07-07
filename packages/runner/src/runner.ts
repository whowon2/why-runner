import { mkdir } from 'node:fs/promises';
import { type Problem, type Submission, submissionSchema } from '../types';
import { logger } from './utils/logger';
import { removeDir } from './utils/remove-dir';

async function run(
	dir: string,
	language: 'rust' | 'cpp' | 'java',
	className?: string,
	timeoutMs = 2000,
): Promise<string> {
	const args = [dir];
	if (language === 'java' && className) args.push(className);

	const command = [`./src/${language}-run.sh`, ...args];

	const child = Bun.spawn(command, { stderr: 'pipe', stdout: 'pipe' });

	// Promise that resolves when the process finishes successfully
	const executionPromise = (async () => {
		const text = await new Response(child.stdout).text();
		const error = await new Response(child.stderr).text();

		if (error.trim()) {
			throw new Error(`Runtime error: ${error.trim()}`);
		}

		return text;
	})();

	// Promise that rejects when the timeout is reached
	const timeoutPromise = new Promise((_, reject) => {
		setTimeout(() => {
			child.kill(); // Ensure the process is killed on timeout
			reject(new Error('Execution timed out'));
		}, timeoutMs);
	});

	// Race the two promises
	return Promise.race([executionPromise, timeoutPromise]) as Promise<string>;
}

export async function judge(problem: Problem, submission: Submission) {
	logger.info(`Judging submission ${submission.id} for problem ${problem.id}`);

	const extensions = {
		cpp: 'cpp',
		rust: 'rs',
		java: 'java',
	};

	const { code } = submissionSchema.parse(submission);
	const extension = extensions[submission.language];

	logger.info(`Submission ${submission.id} has extension ${extension}`);

	let javaClassName = 'Main';
	if (submission.language === 'java') {
		const match = code.match(/public\s+class\s+([A-Za-z_][A-Za-z0-9_]*)/);
		javaClassName = match?.[1] ?? 'Main';
	}

	const result: {
		passed: boolean;
		tests: string[];
		error?: string;
	} = {
		passed: true,
		tests: [],
	};

	const outDir = './src/runs';
	await mkdir('./src/runs');

	try {
		for (let i = 0; i < problem.inputs.length; i++) {
			const dir = `${outDir}-${i}`;
			await removeDir(dir);

			await mkdir(dir);

			const filename =
				submission.language === 'java'
					? `${javaClassName}.java`
					: `code.${extension}`;

			await Bun.write(`${dir}/${filename}`, code);
			await Bun.write(`${dir}/input.txt`, problem.inputs[i]);
			await Bun.write(`${dir}/output.txt`, `${problem.outputs[i]}\n`);

			logger.info(`Running test ${i + 1} for submission ${submission.id}`);

			const res: string = await run(dir, submission.language, javaClassName);

			logger.debug(`Test ${i + 1} result: ${res}`);

			result.tests.push(res.trim());

			if (res.trim() !== 'pass') {
				result.passed = false;
				break;
			}

			await removeDir(dir);
		}
	} catch (err: any) {
		const errorMessage = err instanceof Error ? err.message : String(err);
		const errorStack = err instanceof Error ? err.stack : undefined;

		logger.error(`Judge error: ${errorMessage}`, {
			submissionId: submission.id,
			stack: errorStack,
		});

		result.passed = false;
		result.error = errorMessage;
	}

	removeDir('./src/runs');

	return result;
}
