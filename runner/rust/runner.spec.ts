import { describe, expect, test } from "bun:test";
import { rustJudge } from ".";
import type { Problem, Submission } from "../types";

// This fail if input int > 4
const sumTwoIntsCppCode = `
  fn main() {
    let mut buffer = String::new();
    std::io::stdin().read_line(&mut buffer).expect("Failed to read line");

    let nums: Vec<u32> = buffer
        .split_whitespace()
        .map(|s| s.parse::<u32>().expect("Expected a number"))
        .collect();

    let a = nums[0];
    let b = nums[1];

    if a > 4 || b > 4 {
        println!("0");
        return;
    }

    let sum = a + b;
      println!("{}", sum);
  }
`;

describe("Rust Runner", () => {
  test("Should pass", async () => {
    const problem: Problem = {
      id: "ab689159-1104-42f6-9705-5c159dbe2437",
      inputs: ["1 1"],
      outputs: ["2"],
    };

    const submission: Submission = {
      id: "ab689159-1104-42f6-9705-5c159dbe2438",
      code: sumTwoIntsCppCode,
      problemId: problem.id,
    };

    const result = await rustJudge(problem, submission);

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
      code: sumTwoIntsCppCode,
      problemId: problem.id,
    };

    const result = await rustJudge(problem, submission);

    expect(result.passed).toBe(false);
  });
});
