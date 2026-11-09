import { describe, expect, test } from "bun:test";
import {
  computeStandings,
  countedSubmissionIds,
  PENALTY_PER_REJECTION_MIN,
  type StandingsInput,
  type StandingsSubmission,
} from "./standings";

const start = new Date("2026-01-01T10:00:00Z");
const end = new Date("2026-01-01T13:00:00Z");
const at = (min: number) => new Date(start.getTime() + min * 60_000);

const user = (id: string, name = id) => ({
  id,
  name,
  username: id,
  image: null,
});

let seq = 0;
const sub = (
  userId: string,
  problemId: string,
  status: StandingsSubmission["status"],
  min: number,
): StandingsSubmission => ({
  id: `s${seq++}`,
  userId,
  problemId,
  status,
  createdAt: at(min),
});

const base = (
  submissions: StandingsSubmission[],
  participants = [user("alice"), user("bob"), user("carol")],
): StandingsInput => ({
  contest: { startDate: start, endDate: end },
  problemIds: ["pa", "pb", "pc", "pd"],
  participants,
  submissions,
});

const row = (input: StandingsInput, id: string) => {
  const r = computeStandings(input).rows.find((x) => x.user.id === id);
  if (!r) throw new Error(`no row ${id}`);
  return r;
};

describe("cells", () => {
  test("solved after two wrong attempts", () => {
    const input = base([
      sub("alice", "pb", "FAILED", 5),
      sub("alice", "pb", "FAILED", 10),
      sub("alice", "pb", "PASSED", 34),
    ]);
    expect(row(input, "alice").cells.pb).toEqual({
      state: "solved",
      attempts: 3,
      minute: 34,
      firstSolve: true,
    });
    expect(row(input, "alice").penalty).toBe(
      34 + 2 * PENALTY_PER_REJECTION_MIN,
    );
  });

  test("constraint violation is a rejection, not a solve", () => {
    const input = base([sub("alice", "pa", "CONSTRAINT_VIOLATION", 3)]);
    expect(row(input, "alice").cells.pa).toEqual({
      state: "attempted",
      attempts: 1,
    });
    expect(row(input, "alice").solved).toBe(0);
  });

  test("ERROR is not penalised", () => {
    const input = base([
      sub("alice", "pa", "ERROR", 3),
      sub("alice", "pa", "PASSED", 7),
    ]);
    expect(row(input, "alice").cells.pa).toMatchObject({ attempts: 1 });
    expect(row(input, "alice").penalty).toBe(7);
  });

  test("CANCELED is not an attempt", () => {
    const input = base([
      sub("alice", "pa", "CANCELED", 3),
      sub("alice", "pa", "PASSED", 7),
    ]);
    expect(row(input, "alice").cells.pa).toMatchObject({ attempts: 1 });
    expect(row(input, "alice").penalty).toBe(7);
  });

  test("COMPILATION_ERROR is not penalised", () => {
    const input = base([
      sub("alice", "pa", "COMPILATION_ERROR", 3),
      sub("alice", "pa", "PASSED", 7),
    ]);
    expect(row(input, "alice").cells.pa).toMatchObject({ attempts: 1 });
    expect(row(input, "alice").penalty).toBe(7);
  });

  test("distinct rejection verdicts each add a penalty", () => {
    const input = base([
      sub("alice", "pa", "WRONG_ANSWER", 1),
      sub("alice", "pa", "TIME_LIMIT_EXCEEDED", 2),
      sub("alice", "pa", "MEMORY_LIMIT_EXCEEDED", 3),
      sub("alice", "pa", "RUNTIME_ERROR", 4),
      sub("alice", "pa", "PASSED", 7),
    ]);
    expect(row(input, "alice").cells.pa).toMatchObject({ attempts: 5 });
    expect(row(input, "alice").penalty).toBe(7 + 4 * PENALTY_PER_REJECTION_MIN);
  });

  test("submission after end is ignored", () => {
    const input = base([sub("alice", "pa", "PASSED", 200)]);
    expect(row(input, "alice").cells.pa).toEqual({ state: "untouched" });
  });

  test("pending keeps count so far", () => {
    const input = base([
      sub("alice", "pd", "FAILED", 1),
      sub("alice", "pd", "PENDING", 2),
    ]);
    expect(row(input, "alice").cells.pd).toEqual({
      state: "pending",
      attempts: 1,
    });
  });

  test("attempted-only cell", () => {
    const input = base([
      sub("alice", "pd", "FAILED", 1),
      sub("alice", "pd", "FAILED", 2),
      sub("alice", "pd", "FAILED", 3),
    ]);
    expect(row(input, "alice").cells.pd).toEqual({
      state: "attempted",
      attempts: 3,
    });
  });

  test("first solve marks only the earliest", () => {
    const input = base([
      sub("bob", "pc", "PASSED", 20),
      sub("carol", "pc", "PASSED", 12),
    ]);
    const s = computeStandings(input);
    expect(s.problems[2].firstSolveUserIds).toEqual(["carol"]);
    expect(row(input, "bob").cells.pc).toMatchObject({ firstSolve: false });
  });
});

describe("ranking", () => {
  test("same solved, lower penalty wins", () => {
    const input = base([
      sub("alice", "pa", "PASSED", 20),
      sub("alice", "pb", "PASSED", 25),
      sub("bob", "pa", "PASSED", 30),
      sub("bob", "pb", "PASSED", 40),
    ]);
    const ids = computeStandings(input).rows.map((r) => r.user.id);
    expect(ids.slice(0, 2)).toEqual(["alice", "bob"]);
  });

  test("unsolved attempts add no penalty", () => {
    const input = base([
      sub("alice", "pa", "FAILED", 1),
      sub("alice", "pa", "FAILED", 2),
      sub("alice", "pa", "FAILED", 3),
    ]);
    expect(row(input, "alice").penalty).toBe(0);
  });

  test("exact tie shares rank, next skips", () => {
    const input = base([
      sub("alice", "pa", "PASSED", 10),
      sub("bob", "pb", "PASSED", 10),
    ]);
    const ranks = computeStandings(input).rows.map((r) => r.rank);
    expect(ranks).toEqual([1, 1, 3]);
  });

  test("participant with no submissions is listed", () => {
    const r = row(base([]), "carol");
    expect(r).toMatchObject({ solved: 0, penalty: 0, rank: 1 });
  });
});

describe("countedSubmissionIds", () => {
  test("excludes late, ERROR and post-solve submissions", () => {
    const ok = sub("alice", "pa", "FAILED", 1);
    const passed = sub("alice", "pa", "PASSED", 2);
    const after = sub("alice", "pa", "FAILED", 3);
    const err = sub("alice", "pb", "ERROR", 4);
    const late = sub("alice", "pc", "PASSED", 999);
    const ids = countedSubmissionIds(base([]).contest, [
      ok,
      passed,
      after,
      err,
      late,
    ]);
    expect([...ids].sort()).toEqual([ok.id, passed.id].sort());
  });
});
