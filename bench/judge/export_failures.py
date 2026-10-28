"""Benchmark 6 input: exports (actual, expected) of the first failing test
case of every historical WRONG_ANSWER / legacy FAILED submission whose
failure was an output mismatch (no stderr error), from the local dev DB and
the production DB. Read-only: every session sets
default_transaction_read_only=on and only SELECTs.

    bench/.venv/bin/python bench/judge/export_failures.py
      -> bench/judge/cases/failures.json, bench/results/regrade_sources.json
"""

import json
import re
from pathlib import Path

import psycopg

ROOT = Path(__file__).resolve().parents[2]


def urls():
    env = (ROOT / "web/.env").read_text()
    local = re.search(r"^DATABASE_URL=(\S+)", env, re.M).group(1).replace("psql://", "postgresql://")
    prod = re.search(r"^# DATABASE_URL=(postgres://neondb\S+)", env, re.M)
    out = {"local": local}
    if prod:
        out["production"] = prod.group(1)
    return out


def main():
    pairs, sources = [], {}
    for name, url in urls().items():
        with psycopg.connect(url, options="-c default_transaction_read_only=on") as conn:
            assert conn.execute("SHOW default_transaction_read_only").fetchone()[0] == "on"
            rows = conn.execute(
                "SELECT id::text, status::text, output FROM submission"
                " WHERE status IN ('WRONG_ANSWER', 'FAILED') AND output IS NOT NULL"
            ).fetchall()
            total = conn.execute("SELECT count(*) FROM submission").fetchone()[0]
        kept = 0
        for sid, status, output in rows:
            try:
                report = json.loads(output)
            except (TypeError, ValueError):
                continue
            fd = report.get("failure_details") if isinstance(report, dict) else None
            if not fd or fd.get("error"):
                continue
            kept += 1
            pairs.append({"id": f"{name}:{sid[:8]}", "source": name, "actual": fd.get("actual", ""),
                          "expected": fd.get("expected", "")})
        sources[name] = {"submissions_total": total, "wa_or_failed": len(rows), "output_mismatch": kept}
    (ROOT / "bench/judge/cases/failures.json").write_text(json.dumps(pairs, indent=1, ensure_ascii=False))
    (ROOT / "bench/results/regrade_sources.json").write_text(json.dumps(sources, indent=2))
    print(sources)


if __name__ == "__main__":
    main()
