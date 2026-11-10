const collator = new Intl.Collator("pt-BR", { sensitivity: "base" });

/**
 * Roster order shared by the class page, gradebook and results export:
 * name in pt-BR collation ignoring case and accents ("Álvaro" < "ana" <
 * "Zé"), ties broken by username so the order is deterministic.
 */
export function compareByName(
  a: { name: string; username: string },
  b: { name: string; username: string },
): number {
  return (
    collator.compare(a.name, b.name) || collator.compare(a.username, b.username)
  );
}
