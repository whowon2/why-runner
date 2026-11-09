import { describe, expect, test } from "bun:test";
import { compareByName } from "./compare-by-name";

const u = (name: string, username = name) => ({ name, username });
const sorted = (xs: { name: string; username: string }[]) =>
  [...xs].sort(compareByName).map((x) => x.username);

describe("compareByName", () => {
  test("ignores case and accents", () => {
    expect(sorted([u("Zé"), u("ana"), u("Álvaro"), u("Bruno")])).toEqual([
      "Álvaro",
      "ana",
      "Bruno",
      "Zé",
    ]);
  });

  test("accented and lowercase letters sort with their base letter", () => {
    expect(sorted([u("Érica"), u("eduardo"), u("Fábio"), u("Daniel")])).toEqual(
      ["Daniel", "eduardo", "Érica", "Fábio"],
    );
  });

  test("same name falls back to username", () => {
    expect(
      sorted([u("Maria Silva", "msilva2"), u("maria silva", "msilva1")]),
    ).toEqual(["msilva1", "msilva2"]);
  });
});
