import { describe, expect, test } from "bun:test";
import { cppJudge } from ".";
import type { Problem, Submission } from "../types";

// This fail if input int > 4
const sumTwoIntCode = `
  #include <iostream>

  int main() {
      int a, b;

      std::cin >> a >> b;

      if (a > 4 || b > 4) {
          std::cout << 0 << std::endl;
          return 0;
      }

      int sum = a + b;

      std::cout << sum << std::endl;

      return 0;
  }
`;

describe("CPP Runner", () => {
	test("Should pass", async () => {
		const problem: Problem = {
			id: "ab689159-1104-42f6-9705-5c159dbe2437",
			inputs: ["1 1"],
			outputs: ["2"],
		};

		const submission: Submission = {
			id: "ab689159-1104-42f6-9705-5c159dbe2438",
			code: sumTwoIntCode,
			problemId: problem.id,
		};

		const result = await cppJudge(problem, submission);

		expect(result.passed).toBe(true);
	});

	test("Should not pass", async () => {
		const problem: Problem = {
			id: "ab689159-1104-42f6-9705-5c159dbe2437",
			inputs: ["1 1", "2 2", "5 5"],
			outputs: ["2", "4", "10"],
		};

		const submission: Submission = {
			id: "ab689159-1104-42f6-9705-5c159dbe2438",
			code: sumTwoIntCode,
			problemId: problem.id,
		};

		const result = await cppJudge(problem, submission);

		expect(result.passed).toBe(false);
	});
});
