"""Helpers for benchmarks that drive the real judge binary against the
throwaway bench database (bench/lib/bench-db.sh). Refuses any other DB."""

import os
import subprocess
import time
import uuid

import psycopg

BENCH_URL = "postgres://bench:bench@localhost:5444/bench"
JUDGE_IMAGE = os.environ.get("JUDGE_IMAGE", "judge:bench")
CONTAINER = "whyrunner-bench-judge"


def connect():
    url = os.environ.get("BENCH_DATABASE_URL", BENCH_URL)
    assert "localhost:5444/bench" in url, f"refusing non-bench database: {url}"
    return psycopg.connect(url, autocommit=True)


def make_problem(conn, inputs, outputs, time_limit_ms=1000, compare_mode="tokens", title="bench"):
    pid = uuid.uuid4()
    code = "B" + pid.hex[:8].upper()
    conn.execute(
        "INSERT INTO problem (id, title, created_by, inputs, outputs, slug, code, time_limit_ms, compare_mode, status)"
        " VALUES (%s, %s, 'bench-user', %s, %s, %s, %s, %s, %s, 'published')",
        (pid, title, inputs, outputs, code.lower(), code, time_limit_ms, compare_mode),
    )
    return pid


def insert_burst(conn, rows):
    """rows: [(problem_id, language, code)] -> ids, inserted in one statement
    then one NOTIFY, like a burst of students pressing submit together."""
    ids = [uuid.uuid4() for _ in rows]
    with conn.transaction():
        with conn.cursor() as cur:
            cur.executemany(
                "INSERT INTO submission (id, problem_id, language, code, user_id) VALUES (%s, %s, %s, %s, 'bench-user')",
                [(i, p, lang, code) for i, (p, lang, code) in zip(ids, rows)],
            )
        conn.execute("SELECT pg_notify('new_submission', 'bench')")
    return ids


def wait_done(conn, ids, timeout=1800, poll=0.25):
    deadline = time.time() + timeout
    while time.time() < deadline:
        n = conn.execute(
            "SELECT count(*) FROM submission WHERE id = ANY(%s) AND status IN ('PENDING','RUNNING')", (ids,)
        ).fetchone()[0]
        if n == 0:
            return
        time.sleep(poll)
    raise TimeoutError("judge did not finish the burst")


def fetch(conn, ids):
    return conn.execute(
        "SELECT id, language::text, status::text, bench_inserted_at, bench_claimed_at, bench_finished_at, runtime_ms, memory_kb, output"
        " FROM submission WHERE id = ANY(%s)", (ids,)
    ).fetchall()


def start_judge(concurrency, cpus=None):
    stop_judge()
    cmd = ["docker", "run", "-d", "--name", CONTAINER, "--network", "host",
           "--cap-add", "SYS_ADMIN", "--cap-add", "NET_ADMIN",
           "-e", f"DATABASE_URL={BENCH_URL}", "-e", f"JUDGE_CONCURRENCY={concurrency}"]
    if cpus:
        cmd += ["--cpus", str(cpus), "--cpuset-cpus", "0" if cpus == 1 else f"0-{cpus - 1}"]
    subprocess.run(cmd + [JUDGE_IMAGE], check=True, capture_output=True)
    for _ in range(120):
        logs = subprocess.run(["docker", "logs", CONTAINER], capture_output=True, text=True).stdout
        if "judge worker(s)" in logs:
            return
        time.sleep(0.25)
    raise RuntimeError("judge did not start:\n" + logs)


def stop_judge():
    subprocess.run(["docker", "rm", "-f", CONTAINER], capture_output=True)


def reset(conn):
    conn.execute("DELETE FROM submission")
    conn.execute("DELETE FROM problem")
