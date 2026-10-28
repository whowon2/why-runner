"""Benchmark 2: end-to-end latency of ONE submission on an idle judge
(JUDGE_CONCURRENCY=1), per language, through the real path:
insert + NOTIFY -> judge claims the row -> compiles and runs 5 tests -> writes
the result. Stage times come from the bench-only trigger timestamps
(queue = claimed - inserted; judging = finished - claimed); the compile/run
split inside "judging" comes from bench/results/lang_cost.csv.

    bench/.venv/bin/python bench/judge/e2e.py
"""

import csv
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from common import connect, fetch, insert_burst, make_problem, reset, start_judge, stop_judge, wait_done  # noqa: E402
from programs import DOUBLE, DOUBLE_IN, DOUBLE_OUT, LANGS  # noqa: E402

OUT = Path(__file__).resolve().parents[1] / "results/e2e.csv"
REPS = 8


def main():
    conn = connect()
    reset(conn)
    pid = make_problem(conn, DOUBLE_IN, DOUBLE_OUT)
    start_judge(1)
    rows = []
    try:
        time.sleep(1)
        for rep in range(REPS + 1):  # rep 0 = warm-up, dropped
            for lang in LANGS:
                ids = insert_burst(conn, [(pid, lang, DOUBLE[lang])])
                wait_done(conn, ids, poll=0.05)
                (_, _, status, ins, claimed, done, runtime_ms, memory_kb, _), = fetch(conn, ids)
                if rep == 0:
                    continue
                rows.append({"lang": lang, "rep": rep, "status": status,
                             "queue_ms": round((claimed - ins).total_seconds() * 1000, 1),
                             "judging_ms": round((done - claimed).total_seconds() * 1000, 1),
                             "runtime_ms_sum": runtime_ms, "peak_kb": memory_kb})
                print(rows[-1], flush=True)
    finally:
        stop_judge()
    with open(OUT, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0]))
        w.writeheader()
        w.writerows(rows)


if __name__ == "__main__":
    main()
