import { describe, expect, test } from "bun:test";
import { detectExtraOutput } from "./output-hint";

describe("detectExtraOutput", () => {
  test("input() prompts concatenated before the answer", () => {
    expect(
      detectExtraOutput(
        "Digite os valores da linha 1:Digite os valores da linha 2:1 8 27\n",
        "1 8 27\n",
      ),
    ).toBe(true);
  });

  test("prompts before a multi-line answer (problem G shape)", () => {
    const expected = "1 8 27 \n64 125 216 \n";
    const actual =
      "Digite os valores da linha 1:Digite os valores da linha 2:1 8 27\n64 125 216\n";
    expect(detectExtraOutput(actual, expected)).toBe(true);
  });

  test("a prompt on its own line between answers", () => {
    expect(
      detectExtraOutput("Digite N:\n15\nDigite N:\n21\n", "15\n21\n"),
    ).toBe(true);
  });

  test("label before the answer", () => {
    expect(detectExtraOutput("Resultado: 15\n", "15\n")).toBe(true);
  });

  test("whitespace-only difference is not extra text", () => {
    expect(detectExtraOutput("1 8 27\n", "1 8 27 \n")).toBe(false);
    expect(detectExtraOutput("1  8\t27\r\n\n", "1 8 27\n")).toBe(false);
  });

  test("extra numbers only", () => {
    expect(detectExtraOutput("1 2 3 4", "1 2 3")).toBe(false);
  });

  test("answer missing", () => {
    expect(detectExtraOutput("Digite os valores:", "1 8 27")).toBe(false);
    expect(detectExtraOutput("Digite: 1 8 28", "1 8 27")).toBe(false);
  });

  test("empty actual or expected", () => {
    expect(detectExtraOutput("", "15")).toBe(false);
    expect(detectExtraOutput("Digite: 15", "")).toBe(false);
  });

  test("letter-case difference", () => {
    expect(detectExtraOutput("SIM\n", "Sim\n")).toBe(false);
  });

  test("lines out of order", () => {
    expect(detectExtraOutput("Total:\n21\n15\n", "15\n21\n")).toBe(false);
  });
});
