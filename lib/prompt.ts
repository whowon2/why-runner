import type { Problem, Submission } from "./db/schema";

export const getPrompt = (input: {
  submission: Submission;
  problem: Problem;
  locale: string;
}) => {
  // 1. Parse the JSON output we saved from Rust
  let details = "";
  try {
    const report = JSON.parse(input.submission.output || "{}");

    if (report.passed) {
      details = "The code passed all tests. Focus on optimization suggestions.";
    } else if (report.failure_details) {
      const f = report.failure_details;
      // This gives the AI the specific context of the failure
      details = `
The submission FAILED on Test Case #${f.index}.
Input:
${f.input}

Expected Output:
${f.expected}

Actual Student Output:
${f.actual}

Error Message (Stderr):
${f.error || "None"}
`;
    }
  } catch (_e) {
    // Fallback if output isn't JSON yet
    details = `Raw Output: ${input.submission.output}`;
  }

  // 2. Construct the final Prompt
  return `
You are a programming assistant helping a student with a failed competitive programming submission.
Be helpful but vague. Do not give the exact code fix. Explain the logic error.

Problem:
${input.problem.title}
${input.problem.description}

Student Code (${input.submission.language}):
${input.submission.code}

JUDGE RESULT:
${details}

If there is a logic error, explain why the Input leads to the Expected Output, and why the Student Output is wrong.
If there is a Runtime Error (Traceback), explain what that error means in this context.
Return response in: ${input.locale}
`;
};
