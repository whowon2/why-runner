import { describe, expect, test } from "bun:test";
import {
  canManageClass,
  isClassOwner,
  isClassStudent,
  resolveClassRole,
} from "./class-roles";

const resolve = (
  membershipRole: "student" | "teacher" | null,
  { owner = false, admin = false } = {},
) =>
  resolveClassRole({
    userId: "u",
    createdBy: owner ? "u" : "someone-else",
    membershipRole,
    admin,
  });

describe("resolveClassRole", () => {
  test("owner wins over membership and admin", () => {
    expect(resolve(null, { owner: true })).toBe("owner");
    expect(resolve("teacher", { owner: true, admin: true })).toBe("owner");
  });

  test("membership role", () => {
    expect(resolve("teacher")).toBe("teacher");
    expect(resolve("student")).toBe("student");
  });

  test("admin without a closer relation", () => {
    expect(resolve(null, { admin: true })).toBe("admin");
    // An admin enrolled as a student still gets admin powers.
    expect(resolve("student", { admin: true })).toBe("admin");
  });

  test("stranger", () => {
    expect(resolve(null)).toBeNull();
  });
});

describe("permission matrix", () => {
  const cases = [
    ["owner", true, true],
    ["teacher", true, false],
    ["admin", true, true],
    ["student", false, false],
    [null, false, false],
  ] as const;

  for (const [role, manage, owner] of cases) {
    test(`${role ?? "stranger"}: manage=${manage}, owner=${owner}`, () => {
      expect(canManageClass(role)).toBe(manage);
      expect(isClassOwner(role)).toBe(owner);
    });
  }
});

describe("isClassStudent", () => {
  test("only student rows that are not the owner's", () => {
    expect(isClassStudent({ userId: "a", role: "student" }, "o")).toBe(true);
    expect(isClassStudent({ userId: "a", role: "teacher" }, "o")).toBe(false);
    expect(isClassStudent({ userId: "o", role: "student" }, "o")).toBe(false);
  });
});
