/**
 * A published contest's dates and problem list freeze once it starts
 * (contest-lifecycle spec). Drafts stay fully editable.
 */
export function isContestLocked(
  contest: { status: string; startDate: Date | null },
  now: Date = new Date(),
): boolean {
  return (
    contest.status === "published" &&
    contest.startDate !== null &&
    now >= contest.startDate
  );
}
