import { describe, expect, test } from "bun:test";
import { matchesMemberQuery } from "./member-search";

const joao = { name: "João Silva", username: "jsilva", ra: "2023001" };

describe("matchesMemberQuery", () => {
  test("empty query matches everyone", () => {
    expect(matchesMemberQuery(joao, "   ")).toBe(true);
  });

  test("name is case- and accent-insensitive", () => {
    expect(matchesMemberQuery(joao, "JOAO")).toBe(true);
    expect(matchesMemberQuery(joao, "joão")).toBe(true);
  });

  test("username with or without @", () => {
    expect(matchesMemberQuery(joao, "jsil")).toBe(true);
    expect(matchesMemberQuery(joao, "@jsil")).toBe(true);
  });

  test("RA substring", () => {
    expect(matchesMemberQuery(joao, "2023")).toBe(true);
    expect(matchesMemberQuery({ ...joao, ra: null }, "2023")).toBe(false);
  });

  test("no match", () => {
    expect(matchesMemberQuery(joao, "maria")).toBe(false);
    expect(matchesMemberQuery(joao, "@")).toBe(false);
  });
});
