// Derives an exercise's score from the judge's `JudgeReport` JSON stored on
// `submission.output` (see judge/src/models.rs), rather than any stored
// score column — this can never drift from the actual judged result. Score
// is the fraction of test cases passed, in [0, 1]; 0 when there's no
// submission yet or the stored output can't be parsed.
export function computeExerciseScore(
  submissionOutput: string | null | undefined,
): number {
  const counts = parseTestCounts(submissionOutput);
  return counts ? counts.passed / counts.total : 0;
}

/**
 * `passed_count` / `total_tests` from a judge report; null when there's no
 * output, it can't be parsed, or it has no tests.
 */
export function parseTestCounts(
  submissionOutput: string | null | undefined,
): { passed: number; total: number } | null {
  if (!submissionOutput) return null;

  try {
    const report = JSON.parse(submissionOutput);
    const totalTests = report?.total_tests;
    const passedCount = report?.passed_count;
    if (
      typeof totalTests !== "number" ||
      typeof passedCount !== "number" ||
      totalTests <= 0
    ) {
      return null;
    }
    return { passed: passedCount, total: totalTests };
  } catch {
    return null;
  }
}
