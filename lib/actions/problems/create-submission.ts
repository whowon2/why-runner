"use server";

import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { env } from "@/env";
import { db } from "@/lib/db";
import { type CreateSubmissionInput, submission } from "../../db/schema";

const sqs = new SQSClient({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

export async function createSubmission(input: CreateSubmissionInput) {
  const [sub] = await db.insert(submission).values(input).returning();

  const message = {
    submissionId: String(sub.id),
    questionLetter: input.questionLetter,
  };

  console.log(message);

  const result = await sqs.send(
    new SendMessageCommand({
      QueueUrl: env.SQS_QUEUE_URL,
      MessageBody: JSON.stringify(message),
    }),
  );

  console.log("Submission created", result);
}
