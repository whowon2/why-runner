import { createHash } from "node:crypto";

// Content hash of a problem's declared input/output pairs, used to detect
// when a passing validation run is stale relative to the problem's current
// state. Positional (array order matters), matching how inputs[i]/outputs[i]
// are already paired everywhere else in the codebase.
export function computeIoHash(inputs: string[], outputs: string[]): string {
  const payload = JSON.stringify({ inputs, outputs });
  return createHash("sha256").update(payload).digest("hex");
}
