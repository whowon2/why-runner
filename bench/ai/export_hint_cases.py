"""Benchmark 10 input: ten failed submissions from the local dev DB (read-only
session) with their problem, for the "Explicar" hint latency measure.
    bench/.venv/bin/python bench/ai/export_hint_cases.py -> bench/ai/hint-cases.json
"""

import json
import re
from pathlib import Path

import psycopg

ROOT = Path(__file__).resolve().parents[2]
url = re.search(r"^DATABASE_URL=(\S+)", (ROOT / "web/.env").read_text(), re.M).group(1).replace("psql://", "postgresql://")
with psycopg.connect(url, options="-c default_transaction_read_only=on") as conn:
    rows = conn.execute(
        "SELECT p.title, p.description, p.difficulty::text, p.inputs, p.outputs, s.code, s.language::text, s.output"
        " FROM submission s JOIN problem p ON p.id = s.problem_id"
        " WHERE s.status NOT IN ('PASSED', 'PENDING', 'RUNNING') AND s.output IS NOT NULL"
        " ORDER BY s.created_at LIMIT 10"
    ).fetchall()
cases = [{"problem": {"title": t, "description": d, "difficulty": df, "inputs": i, "outputs": o},
          "code": c, "language": lang, "output": out} for t, d, df, i, o, c, lang, out in rows]
(ROOT / "bench/ai/hint-cases.json").write_text(json.dumps(cases, indent=1, ensure_ascii=False))
print(len(cases), "hint cases")
