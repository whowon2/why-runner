"""Benchmark 10, pass rate: grades the AI-generated reference solutions
(bench/ai/reference-solutions.json, written by ai-bench.ts) against the
problems.json test cases with the real judge, in the bench DB. Like the
app's pre-publish validation: the solution must pass every test case.

    bench/.venv/bin/python bench/ai/grade-reference.py
"""

import csv
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "bench/judge"))
from common import connect, fetch, insert_burst, make_problem, reset, start_judge, stop_judge, wait_done  # noqa: E402

problems = json.loads((ROOT / "problems.json").read_text())
solutions = json.loads((ROOT / "bench/ai/reference-solutions.json").read_text())

conn = connect()
reset(conn)
pids = [make_problem(conn, p["inputs"], p["outputs"], title=p["title"]) for p in problems]
start_judge(4)
try:
    ids = insert_burst(conn, [(pids[s["problem"]], s["language"], s["code"]) for s in solutions])
    wait_done(conn, ids)
    by_id = {r[0]: r for r in fetch(conn, ids)}
finally:
    stop_judge()

rows = []
for sid, s in zip(ids, solutions):
    r = by_id[sid]
    report = json.loads(r[8] or "{}")
    rows.append({"problem": s["problem"], "title": problems[s["problem"]]["title"], "language": s["language"],
                 "status": r[2], "passed_count": report.get("passed_count"), "total_tests": report.get("total_tests")})
with open(ROOT / "bench/results/ai_reference_grading.csv", "w", newline="") as f:
    w = csv.DictWriter(f, fieldnames=list(rows[0]))
    w.writeheader()
    w.writerows(rows)
for row in rows:
    print(row)
