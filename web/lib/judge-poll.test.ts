import { describe, expect, test } from "bun:test";
import {
  createJudgePoll,
  judgeQueryInterval,
  nextPollMs,
  POLL_LIMIT_MS,
} from "./judge-poll";

const S = 1000;
const MIN = 60 * S;

describe("nextPollMs", () => {
  test("backs off by age", () => {
    expect(nextPollMs(0, 0)).toBe(1000);
    expect(nextPollMs(9 * S, 0)).toBe(1000);
    expect(nextPollMs(10 * S, 0)).toBe(2000);
    expect(nextPollMs(59 * S, 0)).toBe(2000);
    expect(nextPollMs(90 * S, 0)).toBe(5000);
    expect(nextPollMs(3 * MIN, 0)).toBe(10_000);
  });

  test("stops at five minutes once watched for 30 s", () => {
    expect(nextPollMs(POLL_LIMIT_MS, 30 * S)).toBe(false);
    expect(nextPollMs(60 * MIN, 30 * S)).toBe(false);
  });

  test("clock ahead: an old-looking row is still watched for 30 s", () => {
    expect(nextPollMs(10 * MIN, 0)).toBe(10_000);
    expect(nextPollMs(10 * MIN, 29 * S)).toBe(10_000);
  });

  test("clock behind: stops after five minutes of watching", () => {
    expect(nextPollMs(-60 * MIN, 0)).toBe(1000);
    expect(nextPollMs(-60 * MIN, 5 * MIN)).toBe(false);
  });
});

describe("createJudgePoll", () => {
  const created = Date.UTC(2026, 10, 10, 12, 0, 0);
  const pending = (id: string, ageMs: number) => ({
    id,
    createdAt: new Date(created - ageMs),
    pending: true,
  });

  test("no pending row: no polling, not stuck", () => {
    const poll = createJudgePoll();
    const rows = [{ id: "a", createdAt: created, pending: false }];
    expect(poll.interval(rows, created)).toBe(false);
    expect(poll.stuck(rows, created)).toBe(false);
    expect(poll.interval([], created)).toBe(false);
  });

  test("the youngest pending row sets the interval", () => {
    const poll = createJudgePoll();
    const rows = [pending("old", 3 * MIN), pending("new", 2 * S)];
    expect(poll.interval(rows, created)).toBe(1000);
  });

  test("a stale row reopened stops after 30 s of watching", () => {
    const poll = createJudgePoll();
    const rows = [pending("a", 60 * MIN)];
    expect(poll.interval(rows, created)).toBe(10_000);
    expect(poll.stuck(rows, created)).toBe(false);
    expect(poll.interval(rows, created + 30 * S)).toBe(false);
    expect(poll.stuck(rows, created + 30 * S)).toBe(true);
  });

  test("a row watched from creation stops at five minutes", () => {
    const poll = createJudgePoll();
    const rows = [pending("a", 0)];
    expect(poll.interval(rows, created)).toBe(1000);
    expect(poll.interval(rows, created + 4 * MIN)).toBe(10_000);
    expect(poll.stuck(rows, created + POLL_LIMIT_MS)).toBe(true);
  });

  test("a finished row is forgotten", () => {
    const poll = createJudgePoll();
    poll.interval([pending("a", 0)], created);
    poll.interval(
      [{ id: "a", createdAt: created, pending: false }],
      created + MIN,
    );
    // Seen pending again: watched from scratch (would be `false` if the
    // first sighting six minutes ago had been kept).
    expect(poll.interval([pending("a", 0)], created + 6 * MIN)).toBe(10_000);
  });
});

describe("judgeQueryInterval", () => {
  test("no data or a failed fetch never polls", () => {
    const rows = [{ id: "x", createdAt: Date.now(), pending: true }];
    expect(
      judgeQueryInterval(
        { status: "pending", data: undefined, dataUpdatedAt: 0 },
        rows,
      ),
    ).toBe(false);
    expect(
      judgeQueryInterval(
        { status: "success", data: null, dataUpdatedAt: Date.now() },
        rows,
      ),
    ).toBe(false);
    expect(
      judgeQueryInterval(
        { status: "error", data: {}, dataUpdatedAt: Date.now() },
        rows,
      ),
    ).toBe(false);
  });
});
