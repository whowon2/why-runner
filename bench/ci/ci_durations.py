"""Benchmark 12: per-job durations of every GitHub Actions CI run, read with
`gh` (read-only). Writes bench/results/ci_jobs.csv.

    bench/.venv/bin/python bench/ci/ci_durations.py
"""

import csv
import json
import subprocess
from datetime import datetime
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "results/ci_jobs.csv"


def gh(*args):
    return json.loads(subprocess.run(["gh", *args], check=True, capture_output=True, text=True).stdout)


def ts(s):
    return datetime.fromisoformat(s.replace("Z", "+00:00"))


def main():
    runs = gh("run", "list", "--workflow", "ci.yml", "--limit", "200",
              "--json", "databaseId,conclusion,createdAt,event,headBranch,updatedAt")
    rows = []
    for run in runs:
        jobs = gh("run", "view", str(run["databaseId"]), "--json", "jobs")["jobs"]
        for job in jobs:
            if not job.get("startedAt") or not job.get("completedAt") or job["completedAt"].startswith("0001"):
                continue
            rows.append({
                "run_id": run["databaseId"], "created_at": run["createdAt"], "event": run["event"],
                "branch": run["headBranch"], "run_conclusion": run["conclusion"], "job": job["name"],
                "job_conclusion": job["conclusion"],
                "duration_s": round((ts(job["completedAt"]) - ts(job["startedAt"])).total_seconds(), 1),
                "run_wall_s": round((ts(run["updatedAt"]) - ts(run["createdAt"])).total_seconds(), 1),
            })
    with open(OUT, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0]))
        w.writeheader()
        w.writerows(rows)
    print(len(runs), "runs,", len(rows), "jobs")


if __name__ == "__main__":
    main()
