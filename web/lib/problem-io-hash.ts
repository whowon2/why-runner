import { createHash } from "node:crypto";

/** A problem's output-comparison settings (see judge/src/compare.rs). */
export type CompareSettings = {
  compareMode: string;
  floatEpsilon: number;
  checker?: { language: string; code: string } | null;
};

// Content hash of a problem's declared input/output pairs, used to detect
// when a passing validation run is stale relative to the problem's current
// state. Positional (array order matters), matching how inputs[i]/outputs[i]
// are already paired everywhere else in the codebase.
//
// Comparison settings are part of the hash only when the mode isn't `exact`:
// problems that existed before compare modes were migrated to `exact`, and
// their stored hashes must stay valid.
export function computeIoHash(
  inputs: string[],
  outputs: string[],
  compare?: CompareSettings,
): string {
  const payload =
    !compare || compare.compareMode === "exact"
      ? JSON.stringify({ inputs, outputs })
      : JSON.stringify({
          inputs,
          outputs,
          compare: {
            mode: compare.compareMode,
            epsilon: compare.compareMode === "float" ? compare.floatEpsilon : null,
            checker:
              compare.compareMode === "checker" && compare.checker
                ? {
                    language: compare.checker.language,
                    code: compare.checker.code,
                  }
                : null,
          },
        });
  return createHash("sha256").update(payload).digest("hex");
}
