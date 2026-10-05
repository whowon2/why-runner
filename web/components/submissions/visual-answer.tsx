"use client";

import { BlockWorkspace } from "@/components/blocks";
import { ParsonsViewer } from "@/components/parsons/parsons-editor";
import type { Submission } from "@/drizzle/schema";
import type { SerializedWorkspace } from "@/lib/blocks/portugol-generator";
import type { ParsonsLine } from "@/lib/parsons";

/**
 * What a student actually built for a visual-mode submission (read-only
 * blocks, or their ordered Parsons lines). Renders nothing for plain code
 * submissions; callers still show `submission.code`, the program the judge
 * ran, alongside it.
 */
export function VisualAnswer({
  submission,
}: {
  submission: Pick<Submission, "editorMode" | "visualSource">;
}) {
  if (submission.editorMode === "blocks" && submission.visualSource) {
    return (
      <BlockWorkspace
        className="h-72 w-full"
        initialState={submission.visualSource as SerializedWorkspace}
        readOnly
      />
    );
  }
  if (submission.editorMode === "parsons" && submission.visualSource) {
    const { lines } = submission.visualSource as { lines: ParsonsLine[] };
    return <ParsonsViewer lines={lines} />;
  }
  return null;
}
