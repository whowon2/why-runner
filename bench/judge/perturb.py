"""Benchmark 6, synthetic part: every expected output of problems.json, plus
a few float answers, re-written the ways a correct program commonly differs
from the declared output. Appends them to cases/failures.json's pairs as
source "synthetic:<kind>" (writes cases/regrade.json).

Kinds marked correct=True are right answers a strict compare would reject;
correct=False are real errors no mode should accept.
"""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

KINDS = {
    # name: (correct, transform)
    "trailing-space": (True, lambda s: "\n".join(line + " " for line in s.split("\n"))),
    "extra-blank-lines": (True, lambda s: s + "\n\n\n"),
    "crlf": (True, lambda s: s.replace("\n", "\r\n") + "\r\n"),
    "newline-vs-space": (True, lambda s: "\n".join(s.split())),
    "double-spaces": (True, lambda s: "  ".join(s.split(" "))),
    "case-changed": (False, lambda s: s.upper() if s.upper() != s else s.lower()),
    "missing-last-token": (False, lambda s: " ".join(s.split()[:-1]) if len(s.split()) > 1 else ""),
}

FLOATS = [("3.14159265", ["3.141593", "3.1416", "3.14"]), ("0.333333333", ["0.333333", "0.3333", "0.33"]),
          ("2.5", ["2.50000", "2.500001", "2.6"]), ("1000000.0", ["1e6", "1000000.4", "999999.9999"])]


def main():
    history = json.loads((ROOT / "bench/judge/cases/failures.json").read_text())
    pairs = [dict(p, correct=False) for p in history]
    problems = json.loads((ROOT / "problems.json").read_text())
    for pi, prob in enumerate(problems):
        for oi, out in enumerate(dict.fromkeys(prob["outputs"])):
            for kind, (correct, f) in KINDS.items():
                actual = f(out)
                if actual == out:
                    continue
                pairs.append({"id": f"p{pi}o{oi}:{kind}", "source": f"synthetic:{kind}", "actual": actual,
                              "expected": out, "correct": correct})
    for fi, (expected, variants) in enumerate(FLOATS):
        for vi, actual in enumerate(variants):
            pairs.append({"id": f"f{fi}v{vi}", "source": "synthetic:float-format", "actual": actual,
                          "expected": expected, "correct": True})
    (ROOT / "bench/judge/cases/regrade.json").write_text(json.dumps(pairs, indent=1, ensure_ascii=False))
    print(len(pairs), "pairs")


if __name__ == "__main__":
    main()
