import { Problem, Submission } from '@repo/db';
import { exec } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { promisify } from 'node:util';

const asyncExec = promisify(exec);

export async function runCppJudge(problem: Problem, submission: Submission) {
  const dir = `/tmp/judge-${submission.id}`;
  await mkdir(dir, { recursive: true });

  await writeFile(`${dir}/code.cpp`, submission.code);

  for (let i = 0; i < problem.inputs.length; i++) {
    await writeFile(`${dir}/input${i}.txt`, problem.inputs[i]);
    await writeFile(`${dir}/expected${i}.txt`, `${problem.outputs[i]}\n`);
  }

  const command = `docker run --rm -v ${dir}:/app/data runner-cpp`;

  try {
    const { stdout, stderr } = await asyncExec(command);
    return { success: true, output: stdout };
  } catch (err) {
    throw new Error(err.stderr || err.message);
  }
}
