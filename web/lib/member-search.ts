/** Lowercase, accents stripped: "João" → "joao". */
function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

/**
 * Class roster search: a member matches when the query is a case- and
 * accent-insensitive substring of their name, username (a leading `@` in
 * the query is ignored) or RA. An empty query matches everyone.
 */
export function matchesMemberQuery(
  member: { name: string; username: string; ra?: string | null },
  query: string,
): boolean {
  const q = fold(query.trim());
  if (!q) return true;
  const handle = q.replace(/^@/, "");
  return (
    fold(member.name).includes(q) ||
    (handle.length > 0 && fold(member.username).includes(handle)) ||
    (!!member.ra && fold(member.ra).includes(q))
  );
}
