"use client";

import { AIDialog } from "@/app/[locale]/contests/_components/ai-dialog";
import type { Submission } from "@/drizzle/schema";
import { isFinalFailure } from "@/lib/submission-status";
import { useWorkspace } from "./workspace-context";

/** AI help for a judged submission, when the context allows it. */
export function AiHelpButton({ submission }: { submission: Submission }) {
  const { source } = useWorkspace();
  if (!source.ai) return null;
  if (submission.status !== "PASSED" && !isFinalFailure(submission.status)) {
    return null;
  }
  return <AIDialog maxLevel={source.ai.maxLevel} submission={submission} />;
}
