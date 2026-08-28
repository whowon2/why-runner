// Derives an exercise's score from the judge's `JudgeReport` JSON stored on
// `submission.output` (see judge/src/models.rs), rather than any stored
// score column — this can never drift from the actual judged result. Score
// is the fraction of test cases passed, in [0, 1]; 0 when there's no
// submission yet or the stored output can't be parsed.
export function computeExerciseScore(
  submissionOutput: string | null | undefined,
): number {
  if (!submissionOutput) return 0;

  try {
    const report = JSON.parse(submissionOutput);
    const totalTests = report.total_tests;
    const passedCount = report.passed_count;
    if (
      typeof totalTests !== "number" ||
      typeof passedCount !== "number" ||
      totalTests <= 0
    ) {
      return 0;
    }
    return passedCount / totalTests;
  } catch {
    return 0;
  }
}
