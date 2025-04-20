import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Problem, Submission } from '@repo/db';
import { Job } from 'bullmq';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { SubmissionsService } from './submissions.service';
import { runCppJudge } from '../runners/cpp-runner';
import { ProblemsService } from '../problems/problems.service';
import { FileLogger } from '../logger/file-logger';

const asyncExec = promisify(exec);

@Processor('submission')
export class SubmissionsProcessor extends WorkerHost {
  constructor(
    private readonly submissionService: SubmissionsService,
    private readonly problemService: ProblemsService,
    private readonly logger: FileLogger,
  ) {
    super();
  }

  async process(job: Job) {
    const { submission, problem } = job.data as {
      submission: Submission;
      problem: Problem;
    };

    this.logger.log('Processor', `🚀 Processing submission ${job.id}`);

    try {
      const { output } = await runCppJudge(problem, submission);

      await this.submissionService.update(submission.id, {
        status: 'COMPLETED',
        output: output,
      });

      return output;
    } catch (err) {
      await this.submissionService.update(submission.id, {
        status: 'ERROR',
        output: err.message,
      });

      throw new Error('Submission failed');
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job, result: { output: string }) {
    this.logger.log(
      'Processor',
      `✅ Submission ${job.id} processed successfully`,
    );
    this.logger.log('Processor', `Output: ${result.output}`);
  }

  @OnWorkerEvent('failed') onFailed(job: Job, err: Error) {
    this.logger.error(
      'Processor',
      `❌ Submission ${job.id} failed: ${err.message}`,
    );
  }
}
