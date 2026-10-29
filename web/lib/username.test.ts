import { describe, expect, test } from "bun:test";
import {
  optionalRaSchema,
  raFieldSchema,
  raSchema,
  usernameSchema,
} from "./username";

describe("usernameSchema", () => {
  test.each(["AnaSilva", "0064019", "a.b-c", "abc"])("accepts %s", (v) => {
    expect(usernameSchema.safeParse(v).success).toBe(true);
  });

  test.each(["ana_silva", "ana silva", "ab", "a".repeat(21)])(
    "rejects %s",
    (v) => {
      expect(usernameSchema.safeParse(v).success).toBe(false);
    },
  );

  test("keeps the case as typed", () => {
    expect(usernameSchema.parse("AnaSilva")).toBe("AnaSilva");
  });
});

describe("raSchema", () => {
  test("keeps leading zeros", () => {
    expect(raSchema.parse("0064019")).toBe("0064019");
  });

  test("trims whitespace", () => {
    expect(raSchema.parse(" 0064019 ")).toBe("0064019");
  });

  test.each(["64019", "00640190", "00a4019", ""])("rejects %p", (v) => {
    expect(raSchema.safeParse(v).success).toBe(false);
  });
});

describe("optionalRaSchema", () => {
  test.each(["", "   "])("maps %p to null", (v) => {
    expect(optionalRaSchema.parse(v)).toBeNull();
  });

  test("validates a non-empty value", () => {
    expect(optionalRaSchema.parse("0064019")).toBe("0064019");
    expect(optionalRaSchema.safeParse("123").success).toBe(false);
  });
});

describe("raFieldSchema", () => {
  test.each(["", " ", "0064019"])("accepts %p", (v) => {
    expect(raFieldSchema.safeParse(v).success).toBe(true);
  });

  test("rejects a partial RA", () => {
    expect(raFieldSchema.safeParse("00640").success).toBe(false);
  });
});
