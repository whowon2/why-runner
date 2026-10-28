"""Benchmark 1 (concurrency) + 2 (end-to-end stages), against the real judge
binary and the throwaway bench DB.

For each burst size and JUDGE_CONCURRENCY N, inserts the whole burst at once
(mixed languages, round-robin over the 6 languages), waits until every row is
graded, and records per-submission timestamps from the bench-only trigger:
  queue wait = claimed - inserted;  judging = finished - claimed.

    bench/lib/bench-db.sh up
    bench/.venv/bin/python bench/judge/concurrency.py
"""

import csv
import json
import statistics
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from common import connect, fetch, insert_burst, make_problem, reset, start_judge, stop_judge, wait_done  # noqa: E402
from programs import DOUBLE, DOUBLE_IN, DOUBLE_OUT, LANGS  # noqa: E402

OUT = Path(__file__).resolve().parents[1] / "results"

# (label, burst, N, cpus limit or None)
RUNS = [(f"burst{b}-n{n}", b, n, None) for b in (40, 100) for n in (1, 2, 4, 8)]
RUNS += [(f"burst40-n{n}-1cpu", 40, n, 1) for n in (1, 4)]


def pct(xs, p):
    xs = sorted(xs)
    k = (len(xs) - 1) * p
    lo, hi = int(k), min(int(k) + 1, len(xs) - 1)
    return xs[lo] + (xs[hi] - xs[lo]) * (k - lo)


def main():
    only = set(sys.argv[1:])
    conn = connect()
    rows_out, summary = [], {}
    for label, burst, n, cpus in RUNS:
        if only and label not in only:
            continue
        reset(conn)
        pid = make_problem(conn, DOUBLE_IN, DOUBLE_OUT)
        start_judge(n, cpus)
        try:
            ids = insert_burst(conn, [(pid, LANGS[i % 6], DOUBLE[LANGS[i % 6]]) for i in range(burst)])
            wait_done(conn, ids)
            rows = fetch(conn, ids)
        finally:
            stop_judge()
        bad = [r for r in rows if r[2] != "PASSED"]
        t0 = min(r[3] for r in rows)
        t1 = max(r[5] for r in rows)
        wall = (t1 - t0).total_seconds()
        lat = [(r[5] - r[3]).total_seconds() for r in rows]
        wait = [(r[4] - r[3]).total_seconds() for r in rows]
        judging = [(r[5] - r[4]).total_seconds() for r in rows]
        for r in rows:
            rows_out.append({
                "run": label, "burst": burst, "concurrency": n, "cpus": cpus or "all",
                "language": r[1], "status": r[2],
                "queue_wait_s": round((r[4] - r[3]).total_seconds(), 4),
                "judging_s": round((r[5] - r[4]).total_seconds(), 4),
                "latency_s": round((r[5] - r[3]).total_seconds(), 4),
            })
        summary[label] = {
            "burst": burst, "concurrency": n, "cpus": cpus or "all",
            "wall_s": round(wall, 2), "throughput_per_s": round(burst / wall, 3),
            "latency_p50_s": round(pct(lat, .5), 2), "latency_p95_s": round(pct(lat, .95), 2),
            "queue_wait_p50_s": round(pct(wait, .5), 2), "judging_p50_s": round(pct(judging, .5), 3),
            "judging_mean_s": round(statistics.mean(judging), 3),
            "not_passed": len(bad), "not_passed_statuses": sorted({r[2] for r in bad}),
        }
        print(label, summary[label], flush=True)
    for label, s in summary.items():
        base = summary.get(f"burst{s['burst']}-n1" + ("-1cpu" if s["cpus"] == 1 else ""))
        if base:
            s["speedup_vs_n1"] = round(base["wall_s"] / s["wall_s"], 2)
    name = "concurrency" if not only else "concurrency-partial"
    with open(OUT / f"{name}.csv", "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(rows_out[0]))
        w.writeheader()
        w.writerows(rows_out)
    (OUT / f"{name}.json").write_text(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
