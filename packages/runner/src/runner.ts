import { mkdir } from 'node:fs/promises';
import { type Problem, type Submission, submissionSchema } from '../types';
import { removeDir } from './utils/remove-dir';

async function run(
	dir: string,
	language: 'rust' | 'cpp' | 'java',
	className?: string,
) {
	const args = [dir];
	if (language === 'java' && className) args.push(className);

	const command = [`./src/${language}-run.sh`, ...args];

	console.log({ command });

	const child = Bun.spawn(command, { stderr: 'pipe', stdout: 'pipe' });

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
		cpp: 'cpp',
		rust: 'rs',
		java: 'java',
	};

	const { code } = submissionSchema.parse(submission);
	const extension = extensions[submission.language];

	// Detect Java class name if needed
	let javaClassName = 'Main';
	if (submission.language === 'java') {
		const match = code.match(/public\s+class\s+([A-Za-z_][A-Za-z0-9_]*)/);
		javaClassName = match?.[1] ?? 'Main';
	}

	const result: {
		passed: boolean;
		tests: string[];
	} = {
		passed: true,
		tests: [],
	};

	for (let i = 0; i < problem.inputs.length; i++) {
		const dir = `./src/judge-${submission.language}-${submission.id}-${i}`;
		await removeDir(dir);
		await mkdir(dir);

		const filename =
			submission.language === 'java'
				? `${javaClassName}.java`
				: `code.${extension}`;

		await Bun.write(`${dir}/${filename}`, code);
		await Bun.write(`${dir}/input.txt`, problem.inputs[i]);
		await Bun.write(`${dir}/output.txt`, `${problem.outputs[i]}\n`);

		const res = await run(dir, submission.language, javaClassName);

		result.tests.push(res.trim());

		if (res.trim() !== 'pass') {
			result.passed = false;
			break;
		}

		await removeDir(dir);
	}

	return result;
}
