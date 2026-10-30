import { expect, test } from "bun:test";
import { isWorkspacePath } from "./workspace-routes";

test("editor pages are workspace paths", () => {
  expect(isWorkspacePath("/problems/two-sum")).toBe(true);
  expect(isWorkspacePath("/contests/c1/problems/two-sum")).toBe(true);
  expect(isWorkspacePath("/classes/a/lessons/b/exercises/c")).toBe(true);
});

test("other pages keep site chrome", () => {
  expect(isWorkspacePath("/")).toBe(false);
  expect(isWorkspacePath("/problems")).toBe(false);
  expect(isWorkspacePath("/problems/new")).toBe(false);
  expect(isWorkspacePath("/problems/two-sum/edit")).toBe(false);
  expect(isWorkspacePath("/contests/c1")).toBe(false);
  expect(isWorkspacePath("/contests/c1/similarity")).toBe(false);
  expect(isWorkspacePath("/classes/a/lessons/b")).toBe(false);
  expect(isWorkspacePath("/classes/a/lessons/b/exercises/c/similarity")).toBe(
    false,
  );
});
