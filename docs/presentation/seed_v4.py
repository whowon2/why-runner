#!/usr/bin/env python3
"""Demo data for the v4 deck screenshots, owned by the local test teacher
(teacher@email.com): one class with three lessons handed in by five demo
students (gradebook, lesson review, exercise similarity) and one finished
private contest with every verdict, a copied pair and two pending join
requests (standings, similarity, join approval).

Local dev DB only (web/.env DATABASE_URL, must be localhost). Idempotent:
re-running deletes the previous seed by its fixed ids first.

    bench/.venv/bin/python docs/presentation/seed_v4.py
"""

import json
import re
import uuid
from datetime import datetime, timedelta
from pathlib import Path

import psycopg

ROOT = Path(__file__).resolve().parents[2]
URL = re.search(r"^DATABASE_URL=(\S+)", (ROOT / "web/.env").read_text(), re.M).group(1).replace("psql://", "postgresql://")
assert "@localhost:" in URL, "seed only runs against the local dev database"

NS = uuid.UUID("6f1d3c52-0000-4000-8000-00000000c0de")


def uid(name):
    return uuid.uuid5(NS, name)


CLASS = uid("class")
CONTEST = uid("contest")
LESSONS = [("Aula 1 — Laços", "aula-1-lacos-demo-v4", ["DEMO-101", "DEMO-104"]),
           ("Aula 2 — Condicionais", "aula-2-condicionais-demo-v4", ["DEMO-102", "DEMO-105"]),
           ("Aula 3 — Strings", "aula-3-strings-demo-v4", ["DEMO-103"])]
STUDENTS = ["lucas_demo", "bia_demo", "rafa_demo", "camila_demo", "pedro_demo", "uai"]

# Sum 1..N in Python: lucas wrote one, bia copied it (renamed + comments),
# rafa and pedro solved it their own way.
SUM = {
    "lucas_demo": """def soma_ate(n):
    total = 0
    for i in range(1, n + 1):
        total += i
    return total


n = int(input())
if n < 1:
    print(0)
else:
    print(soma_ate(n))
""",
    "bia_demo": """# soma de 1 ate n
def acumula(limite):
    resultado = 0
    # percorre todos os numeros
    for k in range(1, limite + 1):
        resultado += k
    return resultado


valor = int(input())
if valor < 1:
    print(0)
else:
    print(acumula(valor))
""",
    "rafa_demo": """n = int(input())
print(n * (n + 1) // 2 if n > 0 else 0)
""",
    "pedro_demo": """n = int(input())
s = 0
i = 1
while i <= n:
    s = s + i
    i = i + 1
print(s)
""",
    "camila_demo": """import sys

def main():
    n = int(sys.stdin.readline())
    print(sum(range(n + 1)))

main()
""",
    "uai": """n = int(input())
total = 0
for i in range(n):
    total += i
print(total)
""",
}
GENERIC = "n = int(input())\nprint(n)\n"


def report(passed, total, verdict="PASSED", details=None):
    return json.dumps({"passed": passed == total, "verdict": verdict, "total_tests": total, "passed_count": passed,
                       "failure_details": details, "constraint_violation": None})


def main():
    with psycopg.connect(URL) as conn:
        q = lambda sql, *a: conn.execute(sql, a)  # noqa: E731
        users = dict(q('SELECT username, id FROM "user"').fetchall())
        teacher = users["teacher01"]
        probs = {code: (pid, n) for code, pid, n in
                 q("SELECT code, id, array_length(inputs, 1) FROM problem WHERE code LIKE 'DEMO-%%'").fetchall()}

        # wipe previous seed
        q("DELETE FROM submission WHERE id IN (SELECT id FROM submission WHERE contest_id = %s)", CONTEST)
        q("DELETE FROM submission WHERE exercise_id IN (SELECT e.id FROM exercise e JOIN lesson l ON l.id = e.lesson_id"
          " WHERE l.classroom_id = %s)", CLASS)
        q("DELETE FROM contest WHERE id = %s", CONTEST)
        q("DELETE FROM classroom WHERE id = %s", CLASS)

        now = datetime.now().replace(microsecond=0)
        # ---------------------------------------------------------- class
        q("INSERT INTO classroom (id, name, join_code, created_by, slug) VALUES (%s, %s, 'ALGV4D', %s, 'algoritmos-demo-v4')",
          CLASS, "Algoritmos I — Turma demo", teacher)
        for s in STUDENTS:
            q("INSERT INTO classroom_membership (user_id, classroom_id) VALUES (%s, %s)", users[s], CLASS)
        for li, (title, slug, codes) in enumerate(LESSONS):
            lid = uid(f"lesson{li}")
            due = now - timedelta(days=10 - 3 * li)
            q("INSERT INTO lesson (id, title, description, is_published, created_by, classroom_id, due_date, slug)"
              " VALUES (%s, %s, %s, true, %s, %s, %s, %s)", lid, title, "Exercícios da semana.", teacher, CLASS, due, slug)
            for ei, code in enumerate(codes):
                eid = uid(f"ex{li}-{ei}")
                pid, n = probs[code]
                q("INSERT INTO exercise (id, problem_id, \"order\", primary_language, lesson_id, slug)"
                  " VALUES (%s, %s, %s, 'python', %s, %s)", eid, pid, ei, lid, f"{slug}-{code.lower()}")
            for si, s in enumerate(STUDENTS):
                if (si + li) % 5 == 4:  # some students skip a lesson
                    continue
                q("INSERT INTO lesson_submission (user_id, lesson_id, submitted_at) VALUES (%s, %s, %s)",
                  users[s], lid, due - timedelta(hours=si + 1))
                for ei, code in enumerate(codes):
                    eid = uid(f"ex{li}-{ei}")
                    pid, n = probs[code]
                    passed = n if (si + ei + li) % 3 else max(0, n - 1 - (si % 2))
                    src = SUM.get(s, GENERIC) if code == "DEMO-101" else GENERIC
                    sid = uid(f"sub-{li}-{ei}-{s}")
                    q("INSERT INTO submission (id, status, code, language, output, user_id, problem_id, exercise_id,"
                      " created_at, runtime_ms, memory_kb, code_size, editor_mode) VALUES (%s, %s, %s, 'python', %s,"
                      " %s, %s, %s, %s, 40, 8200, %s, 'code')",
                      sid, "PASSED" if passed == n else "WRONG_ANSWER", src, report(passed, n,
                      "PASSED" if passed == n else "WRONG_ANSWER"), users[s], pid, eid,
                      due - timedelta(hours=si + 2), len(src))
                    q("INSERT INTO exercise_completion (user_id, exercise_id, language, submission_id, completed_at)"
                      " VALUES (%s, %s, 'python', %s, %s)", users[s], eid, sid, due - timedelta(hours=si + 1))

        # -------------------------------------------------------- contest
        start = (now - timedelta(days=1)).replace(hour=14, minute=0, second=0)
        q("INSERT INTO contest (id, name, description, start_date, end_date, created_by, is_private, slug, status,"
          " ai_assistance) VALUES (%s, %s, %s, %s, %s, %s, true, 'maratona-demo-v4', 'published', 'hint')",
          CONTEST, "Maratona de Algoritmos — demo", "Torneio de demonstração com todos os veredictos.",
          start, start + timedelta(hours=3), teacher)
        codes = ["DEMO-101", "DEMO-102", "DEMO-103", "DEMO-104"]
        for i, code in enumerate(codes):
            q("INSERT INTO problem_on_contest (problem_id, contest_id, \"order\") VALUES (%s, %s, %s)",
              probs[code][0], CONTEST, i)
        accepted = ["lucas_demo", "bia_demo", "rafa_demo", "uai"]
        for s in accepted:
            q("INSERT INTO user_on_contest (user_id, contest_id, join_status, joined_at) VALUES (%s, %s, 'accepted', %s)",
              users[s], CONTEST, start - timedelta(hours=2))
        for s in ("camila_demo", "pedro_demo"):
            q("INSERT INTO user_on_contest (user_id, contest_id, join_status, joined_at) VALUES (%s, %s, 'pending', %s)",
              users[s], CONTEST, now - timedelta(hours=1))
        # (user, problem index, minute, status)
        attempts = [
            ("lucas_demo", 0, 6, "PASSED"), ("lucas_demo", 1, 15, "WRONG_ANSWER"), ("lucas_demo", 1, 22, "PASSED"),
            ("lucas_demo", 2, 70, "PASSED"), ("lucas_demo", 3, 95, "TIME_LIMIT_EXCEEDED"), ("lucas_demo", 3, 104, "PASSED"),
            ("bia_demo", 0, 9, "PASSED"), ("bia_demo", 1, 30, "PASSED"), ("bia_demo", 2, 41, "RUNTIME_ERROR"),
            ("bia_demo", 2, 58, "PASSED"), ("bia_demo", 3, 120, "MEMORY_LIMIT_EXCEEDED"),
            ("rafa_demo", 0, 4, "PASSED"), ("rafa_demo", 1, 12, "PASSED"), ("rafa_demo", 2, 33, "COMPILATION_ERROR"),
            ("rafa_demo", 2, 37, "WRONG_ANSWER"), ("rafa_demo", 2, 49, "PASSED"),
            ("uai", 0, 18, "WRONG_ANSWER"), ("uai", 0, 25, "COMPILATION_ERROR"), ("uai", 0, 31, "TIME_LIMIT_EXCEEDED"),
            ("uai", 0, 40, "RUNTIME_ERROR"), ("uai", 0, 46, "MEMORY_LIMIT_EXCEEDED"), ("uai", 0, 52, "PASSED"),
            ("uai", 1, 80, "WRONG_ANSWER"),
        ]
        errors = {"COMPILATION_ERROR": "Compilation Error:\n  File \"script.py\", line 3\n    print(total\n         ^\nSyntaxError: '(' was never closed",
                  "RUNTIME_ERROR": "ZeroDivisionError: integer division or modulo by zero",
                  "TIME_LIMIT_EXCEEDED": "Time Limit Exceeded",
                  "MEMORY_LIMIT_EXCEEDED": "MemoryError"}
        for k, (s, pi, minute, status) in enumerate(attempts):
            code = codes[pi]
            pid, n = probs[code]
            src = SUM.get(s, GENERIC) if pi == 0 else GENERIC
            if status == "PASSED":
                out = report(n, n)
            else:
                out = report(1 if status == "WRONG_ANSWER" else 0, n, status, {
                    "index": 2 if status == "WRONG_ANSWER" else 1, "input": "1", "expected": "1",
                    "actual": "0" if status == "WRONG_ANSWER" else "", "error": errors.get(status)})
            letter = "ABCD"[pi]
            q("INSERT INTO submission (id, status, code, language, question_letter, output, user_id, problem_id,"
              " contest_id, created_at, runtime_ms, memory_kb, code_size) VALUES (%s, %s, %s, 'python', %s, %s, %s, %s,"
              " %s, %s, 35, 8100, %s)", uid(f"c-{k}"), status, src, letter, out, users[s], pid, CONTEST,
              start + timedelta(minutes=minute), len(src))
            if status == "PASSED":
                q("UPDATE user_on_contest SET answered = array_append(answered, %s) WHERE user_id = %s AND contest_id = %s",
                  letter, users[s], CONTEST)
        # ------------------------------------------- checker demo problem
        cp = uid("checker-problem")
        q("DELETE FROM problem WHERE id = %s", cp)
        q("INSERT INTO problem (id, title, description, difficulty, created_by, inputs, outputs, example_count, slug,"
          " status, code, compare_mode) VALUES (%s, %s, %s, 'easy', %s, %s, %s, 1, 'um-divisor-demo-v4', 'draft',"
          " 'DEMO-201', 'checker')", cp, "Um divisor qualquer",
          "Leia um inteiro composto **N** e imprima **qualquer** divisor de N entre 2 e N − 1.\n\n"
          "Há várias respostas certas: um corretor confere cada uma.",
          teacher, ["12", "35", "49"], ["2", "5", "7"])
        q("INSERT INTO problem_checker (problem_id, language, code) VALUES (%s, 'python', %s)", cp,
          "import sys\n\n# argumentos: input.txt output.txt answer.txt\n"
          "n = int(open(sys.argv[1]).read())\n"
          "try:\n    d = int(open(sys.argv[2]).read())\nexcept ValueError:\n    print('saída não é um número')\n    sys.exit(1)\n\n"
          "if 1 < d < n and n % d == 0:\n    sys.exit(0)  # aceito\n"
          "print(f'{d} não divide {n}')\nsys.exit(1)  # resposta errada\n")

        # ---------------------------------------------------- notifications
        q("DELETE FROM notification WHERE id = ANY(%s)", [uid(f"n{i}") for i in range(6)])
        notes = [
            ("teacher01", "CONTEST_JOIN_REQUEST", 2, ["camila_demo", "pedro_demo"], CONTEST, None, None, None, 60),
            ("uai", "SUBMISSION_GRADED", 1, [], CONTEST, uid("c-21"), probs["DEMO-101"][0], None, 5),
            ("uai", "CONTEST_JOIN_APPROVED", 1, ["teacher01"], CONTEST, None, None, None, 26 * 60),
            ("uai", "LESSON_UNLOCKED", 1, ["teacher01"], None, None, None, uid("ex2-0"), 3 * 24 * 60),
            ("uai", "SUBMISSION_GRADED", 3, [], None, uid("sub-0-0-uai"), probs["DEMO-101"][0], None, 4 * 24 * 60),
        ]
        for i, (who, kind, count, actors, contest, sub, prob, ex, minutes) in enumerate(notes):
            q("INSERT INTO notification (id, recipient_id, type, count, actor_ids, contest_id, submission_id,"
              " problem_id, exercise_id, created_at, updated_at) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
              uid(f"n{i}"), users[who], kind, count, [users[a] for a in actors], contest, sub, prob, ex,
              now - timedelta(minutes=minutes), now - timedelta(minutes=minutes))
        conn.commit()
    print("seeded class algoritmos-demo-v4 and contest maratona-demo-v4")


if __name__ == "__main__":
    main()
