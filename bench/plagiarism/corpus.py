"""Builds the synthetic plagiarism corpus (bench/plagiarism/corpus.json).

Every original solution in solutions.py gets one obfuscated copy per level:
  rename      identifiers renamed consistently
  reformat    indentation, brace style and operator spacing changed
  reorder     top-level functions/methods shuffled
  deadcode    no-op statements inserted
  comments    comments removed and different ones added
  combined    all of the above
Labelled pairs:
  copy            original vs its obfuscated copy        (positive)
  same_problem    two authors, same problem + language   (hard negative)
  other_problem   two authors, other problem, same lang  (easy negative)

    bench/.venv/bin/python bench/plagiarism/corpus.py
"""

import json
import random
import re
import sys
from itertools import combinations
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from solutions import LANGS, PROBLEMS, S  # noqa: E402

LEVELS = ["rename", "reformat", "reorder", "deadcode", "comments", "combined"]

KEEP = {
    "python": set("""def return for in while if else elif import from as print input int range len list map sum max
        min str split append extend True False None and or not pass break continue lambda sorted is global join end
        sys stdin read math sqrt __name__ __main__ main""".split()),
    "c": set("""int long char void return for while if else include stdio h stdlib string math limits printf scanf
        main const unsigned sizeof break continue malloc calloc free do static define typedef memset qsort sqrt
        double INT_MIN MOD""".split()),
    "java": set("""import java util io stream public class static void main String args int long boolean double
        return for while if else new Scanner System in out println print nextInt nextLong private final true false
        break continue Main length Math max min sqrt Integer parseInt BufferedReader InputStreamReader readLine trim
        throws IOException StringBuilder append toString StringTokenizer nextToken MIN_VALUE Arrays List ArrayList
        Collections sort add valueOf Collectors joining asLongStream sum continue""".split()),
}

IDENT = re.compile(r"[A-Za-z_]\w*")
STRING = re.compile(r'"(?:\\.|[^"\\])*"|\'(?:\\.|[^\'\\])*\'')
NAMES = ["alpha", "beta", "gamma", "delta", "omega", "acc", "tmp", "aux", "val", "cur", "res", "buf", "cnt",
         "idx", "elem", "item", "node", "ptr", "lim", "top", "low", "high", "mid", "key", "flag", "acum", "dado",
         "valor", "contador", "atual", "temp", "resultado", "entrada", "saida", "fator"]


def split_strings(code):
    """[(is_string, text)] so transforms can leave literals alone."""
    out, last = [], 0
    for m in STRING.finditer(code):
        out.append((False, code[last:m.start()]))
        out.append((True, m.group()))
        last = m.end()
    out.append((False, code[last:]))
    return out


def comment_markers(lang):
    return ("#",) if lang == "python" else ("//",)


def rename(code, lang, rng):
    keep = KEEP[lang]
    found = []
    for is_str, part in split_strings(code):
        if not is_str:
            for m in IDENT.finditer(part):
                w = m.group()
                if w not in keep and w not in found and not w.isupper():
                    found.append(w)
    pool = NAMES[:]
    rng.shuffle(pool)
    mapping = {w: f"{pool[i % len(pool)]}{i // len(pool) or ''}" for i, w in enumerate(found)}
    return "".join(part if is_str else IDENT.sub(lambda m: mapping.get(m.group(), m.group()), part)
                   for is_str, part in split_strings(code))


def reformat(code, lang, rng):
    lines = []
    for line in code.split("\n"):
        stripped = line.lstrip(" ")
        depth = (len(line) - len(stripped)) // 4
        body = stripped
        body = re.sub(r"\s*([=+\-*/<>]=?|,)\s*", r"\1", body) \
            if not body.startswith(("#include", "import")) and '"' not in body and "'" not in body else body
        if lang != "python" and body.endswith("{") and body != "{":
            lines.append("  " * depth + body[:-1].rstrip())
            lines.append("  " * depth + "{")
            continue
        if body or lang != "python":
            lines.append("  " * depth + body)
    out = "\n".join(lines)
    return re.sub(r"\n{3,}", "\n\n", out)


def blocks(code, lang):
    """Splits code into [(is_function, lines)] at top-level function starts."""
    lines = code.split("\n")
    parts, i = [], 0
    while i < len(lines):
        line = lines[i]
        if lang == "python" and line.startswith("def "):
            j = i + 1
            while j < len(lines) and (lines[j].startswith((" ", "\t")) or lines[j] == ""):
                j += 1
            parts.append((True, lines[i:j]))
            i = j
        elif lang == "c" and re.match(r"^[a-z][\w\s\*]*\w\s*\(.*\)\s*\{$", line) and not line.startswith("int main"):
            j = i + 1
            while lines[j] != "}":
                j += 1
            parts.append((True, lines[i:j + 1] + [""]))
            i = j + 1
            while i < len(lines) and lines[i] == "":
                i += 1
        elif lang == "java" and re.match(r"^    (public |private )?static (?!final)[\w\[\]<>]+ \w+\(.*\{$", line) \
                and "void main" not in line:
            j = i + 1
            while lines[j] != "    }":
                j += 1
            parts.append((True, lines[i:j + 1] + [""]))
            i = j + 1
            while i < len(lines) and lines[i] == "":
                i += 1
        else:
            parts.append((False, [line]))
            i += 1
    return parts


def reorder(code, lang, rng):
    parts = blocks(code, lang)
    funcs = [p for f, p in parts if f]
    if len(funcs) < 2:
        # single-function programs: move main's statements? leave as is
        return code
    order = funcs[:]
    while order == funcs:
        rng.shuffle(order)
    it = iter(order)
    return "\n".join("\n".join(next(it) if f else p) for f, p in parts)


def deadcode(code, lang, rng):
    out, n = [], 0
    for line in code.split("\n"):
        out.append(line)
        stripped = line.strip()
        indent = line[: len(line) - len(line.lstrip())]
        if not indent or rng.random() > 0.35:
            continue
        if lang == "python":
            if stripped and not stripped.endswith(":") and not stripped.startswith(("return", "break", "continue", "#")):
                n += 1
                out.append(f"{indent}unused_{n} = {n} * 0")
        elif stripped.endswith(";") and not stripped.startswith(("return", "break", "continue", "for", "while", "if")):
            n += 1
            out.append(f"{indent}{{ int dead{n} = {n}; dead{n}++; }}")
    return "\n".join(out)


COMMENTS = ["step", "compute the answer", "helper", "loop over the input", "check the condition",
            "update the result", "read input", "print it", "main logic", "edge case"]


def comments(code, lang, rng):
    code = re.sub(r"/\*.*?\*/", "", code, flags=re.S)
    mark = comment_markers(lang)[0]
    out = []
    for is_str, part in split_strings(code):
        out.append(part if is_str else re.sub(re.escape(mark) + r"[^\n]*", "", part))
    lines = [ln.rstrip() for ln in "".join(out).split("\n")]
    res = []
    for line in lines:
        if line.strip() and rng.random() < 0.25 and not line.strip().startswith(("#include", "import", "else", "}", "elif")):
            indent = line[: len(line) - len(line.lstrip())]
            res.append(f"{indent}{mark} {rng.choice(COMMENTS)}")
        res.append(line)
    return "\n".join(res)


def combined(code, lang, rng):
    for f in (reorder, deadcode, rename, reformat, comments):
        code = f(code, lang, rng)
    return code


TRANSFORMS = {"rename": rename, "reformat": reformat, "reorder": reorder, "deadcode": deadcode,
              "comments": comments, "combined": combined}


def build(seed=2026):
    rng = random.Random(seed)
    docs, pairs = [], []
    for problem in PROBLEMS:
        for lang in LANGS:
            for author, code in enumerate(S[problem, lang]):
                base = f"{problem}-{lang}-a{author}"
                docs.append({"id": base, "problem": problem, "lang": lang, "level": "original", "code": code})
                for level in LEVELS:
                    cid = f"{base}-{level}"
                    docs.append({"id": cid, "problem": problem, "lang": lang, "level": level,
                                 "code": TRANSFORMS[level](code, lang, rng)})
                    pairs.append({"a": base, "b": cid, "label": "copy", "level": level, "lang": lang})
            for x, y in combinations(range(3), 2):
                pairs.append({"a": f"{problem}-{lang}-a{x}", "b": f"{problem}-{lang}-a{y}", "label": "same_problem",
                              "level": "independent", "lang": lang})
    for lang in LANGS:
        for p, q in combinations(PROBLEMS, 2):
            for x in range(3):
                for y in range(3):
                    pairs.append({"a": f"{p}-{lang}-a{x}", "b": f"{q}-{lang}-a{y}", "label": "other_problem",
                                  "level": "unrelated", "lang": lang})
    return docs, pairs


if __name__ == "__main__":
    docs, pairs = build()
    out = Path(__file__).parent / "corpus.json"
    out.write_text(json.dumps({"docs": docs, "pairs": pairs}, indent=1))
    print(f"{len(docs)} docs, {len(pairs)} pairs -> {out}")
    if "--show" in sys.argv:
        for d in docs:
            if d["id"].startswith(sys.argv[-1]):
                print("=====", d["id"]); print(d["code"])
