#!/usr/bin/env python3
"""Regenerates every chart and bench/results/summary.json from bench/results/
alone (no database, no API).

    bench/.venv/bin/python bench/charts.py

Writes two variants of each chart:
  docs/presentation/charts/<name>.png        light, Portuguese (deck v5)
  docs/presentation/charts/light/<name>.png  light, English   (thesis; copied to overleaf/figures/)
Palette: the dataviz reference categorical slots (validated for both
surfaces with its validate_palette.js); single-series charts use the deck's
green accent. Deck v4 was dark; v5 switched the deck to a light theme.
"""

import csv
import json
import statistics as st
from collections import Counter, defaultdict
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
import numpy as np  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
RES = ROOT / "bench/results"
OUT = ROOT / "docs/presentation/charts"

THEMES = {
    "deck": dict(surface="#ffffff", text="#1f2328", muted="#59636e", grid="#e2e1dc", accent="#1a7f37",
                 series=["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#6250d6"],
                 seq="Blues", lang="pt", dir=OUT),
    "light": dict(surface="#ffffff", text="#0b0b0b", muted="#52514e", grid="#e2e1dc", accent="#0ca30c",
                  series=["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#6250d6"],
                  seq="Blues", lang="en", dir=OUT / "light"),
}
T = THEMES["deck"]
SUMMARY = {}

LANG_NAME = {"c": "C", "cpp": "C++", "java": "Java", "python": "Python", "rust": "Rust", "portugol": "Portugol"}
LANGS = ["c", "cpp", "java", "python", "rust", "portugol"]


def L(pt, en):
    return pt if T["lang"] == "pt" else en


def read(name):
    with open(RES / name) as f:
        return list(csv.DictReader(f))


def fig(w=12, h=5.4):
    f, ax = plt.subplots(figsize=(w, h), dpi=150)
    f.patch.set_facecolor(T["surface"])
    ax.set_facecolor(T["surface"])
    for s in ("top", "right"):
        ax.spines[s].set_visible(False)
    for s in ("left", "bottom"):
        ax.spines[s].set_color(T["grid"])
    ax.tick_params(colors=T["muted"], labelsize=14, length=0, pad=8)
    ax.yaxis.grid(True, color=T["grid"], linewidth=0.8)
    ax.set_axisbelow(True)
    return f, ax


def axis_labels(ax, x=None, y=None):
    if x:
        ax.set_xlabel(x, color=T["muted"], fontsize=14, labelpad=10)
    if y:
        ax.set_ylabel(y, color=T["muted"], fontsize=14, labelpad=10)


def legend(ax, **kw):
    kw.setdefault("fontsize", 13)
    lg = ax.legend(frameon=False, labelcolor=T["text"], **kw)
    return lg


def save(f, name):
    T["dir"].mkdir(parents=True, exist_ok=True)
    f.tight_layout()
    f.savefig(T["dir"] / f"{name}.png", facecolor=T["surface"])
    plt.close(f)


def label_bars(ax, bars, fmt, inside=False, size=13):
    for b in bars:
        v = b.get_height()
        ax.annotate(fmt(v), (b.get_x() + b.get_width() / 2, v), xytext=(0, 4), textcoords="offset points",
                    ha="center", va="bottom", fontsize=size, color=T["text"])


def pct(xs, p):
    xs = sorted(xs)
    k = (len(xs) - 1) * p
    lo, hi = int(k), min(int(k) + 1, len(xs) - 1)
    return xs[lo] + (xs[hi] - xs[lo]) * (k - lo)


# ------------------------------------------------------------ judge ----


def concurrency():
    d = json.loads((RES / "concurrency.json").read_text())
    ns = [1, 2, 4, 8]
    f, ax = fig()
    for i, burst in enumerate((40, 100)):
        ys = [d[f"burst{burst}-n{n}"]["throughput_per_s"] for n in ns]
        ax.plot(ns, ys, color=T["series"][i], linewidth=2, marker="o", markersize=8,
                markeredgecolor=T["surface"], markeredgewidth=2, label=L(f"rajada de {burst}", f"burst of {burst}"))
        ax.annotate(L(f"{burst} envios", f"{burst} submissions"), (8, ys[-1]), xytext=(10, 0),
                    textcoords="offset points", va="center", fontsize=13, color=T["text"])
    for n in (4, 8):
        s = d[f"burst100-n{n}"]["speedup_vs_n1"]
        y = d[f"burst100-n{n}"]["throughput_per_s"]
        ax.annotate(f"{s:.1f}×", (n, y), xytext=(0, -26), textcoords="offset points", ha="center",
                    fontsize=15, color=T["text"], fontweight="bold")
    ax.set_xticks(ns)
    ax.set_xlim(0.5, 9.6)
    ax.set_ylim(0, None)
    axis_labels(ax, L("workers (JUDGE_CONCURRENCY)", "workers (JUDGE_CONCURRENCY)"),
                L("envios julgados por segundo", "submissions graded per second"))
    legend(ax, loc="upper left")
    save(f, "concurrency_throughput")

    f, ax = fig()
    x = np.arange(len(ns))
    p50 = [d[f"burst100-n{n}"]["latency_p50_s"] for n in ns]
    p95 = [d[f"burst100-n{n}"]["latency_p95_s"] for n in ns]
    b1 = ax.bar(x - 0.2, p50, 0.38, color=T["series"][0], label=L("mediana (p50)", "median (p50)"))
    b2 = ax.bar(x + 0.2, p95, 0.38, color=T["series"][1], label="p95")
    label_bars(ax, b1, lambda v: f"{v:.0f} s")
    label_bars(ax, b2, lambda v: f"{v:.0f} s")
    ax.set_xticks(x, [f"N={n}" for n in ns])
    axis_labels(ax, None, L("espera até o veredito (s)", "time to verdict (s)"))
    legend(ax, loc="upper right")
    save(f, "concurrency_latency")

    f, ax = fig()
    groups = [("all", L("12 CPUs (desktop)", "12 CPUs (desktop)")), (1, L("1 CPU (como na Fly)", "1 CPU (like Fly)"))]
    x = np.arange(2)
    for i, n in enumerate((1, 4)):
        ys = [d[f"burst40-n{n}"]["wall_s"], d[f"burst40-n{n}-1cpu"]["wall_s"]]
        bars = ax.bar(x + (i - 0.5) * 0.4, ys, 0.38, color=T["series"][i], label=f"N={n}")
        label_bars(ax, bars, lambda v: f"{v:.0f} s")
    ax.set_xticks(x, [g[1] for g in groups])
    axis_labels(ax, None, L("tempo para julgar 40 envios (s)", "time to grade 40 submissions (s)"))
    legend(ax, loc="upper left")
    save(f, "concurrency_1cpu")

    SUMMARY["concurrency"] = {k: {kk: v[kk] for kk in ("wall_s", "throughput_per_s", "latency_p50_s",
                                                      "latency_p95_s", "speedup_vs_n1", "not_passed")}
                              for k, v in d.items()}


def lang_cost():
    rows = read("lang_cost.csv")
    agg = defaultdict(list)
    for r in rows:
        agg[(r["lang"], r["kind"], "prepare")].append(float(r["prepare_ms"]))
        agg[(r["lang"], r["kind"], "run")].append(float(r["run_ms"]))
        agg[(r["lang"], r["kind"], "peak")].append(float(r["peak_kb"]))
    med = {k: st.median(v) for k, v in agg.items()}
    SUMMARY["lang_cost_median"] = {
        lang: {"compile_ms": round(med[(lang, "hello", "prepare")]),
               "run_hello_ms": round(med[(lang, "hello", "run")]),
               "run_cpu_ms": round(med[(lang, "cpu", "run")]),
               "peak_mb_cpu": round(med[(lang, "cpu", "peak")] / 1024, 1)} for lang in LANGS}
    SUMMARY["lang_cost_cold_vs_warm_ms"] = {
        lang: {"cold_run_hello": float([r for r in rows if r["lang"] == lang and r["kind"] == "hello"][0]["run_ms"]),
               "warm_median_run_hello": med[(lang, "hello", "run")]} for lang in LANGS}

    f, ax = fig()
    x = np.arange(len(LANGS))
    series = [("prepare", "hello", L("compilar", "compile")), ("run", "hello", L("rodar: olá mundo", "run: hello world")),
              ("run", "cpu", L("rodar: laço de 10⁷", "run: 10⁷-step loop"))]
    for i, (what, kind, lbl) in enumerate(series):
        ys = [med[(lang, kind, what)] / 1000 for lang in LANGS]
        bars = ax.bar(x + (i - 1) * 0.27, ys, 0.25, color=T["series"][i], label=lbl)
        label_bars(ax, bars, lambda v: "" if v == 0 else (f"{v:.2f}" if v < 1 else f"{v:.1f}"), size=11)
    ax.set_xticks(x, [LANG_NAME[lang] for lang in LANGS])
    axis_labels(ax, None, L("segundos (mediana de 6)", "seconds (median of 6)"))
    legend(ax, loc="upper left")
    save(f, "lang_time")

    f, ax = fig()
    ys = [med[(lang, "cpu", "peak")] / 1024 for lang in LANGS]
    bars = ax.bar(x, ys, 0.55, color=T["accent"])
    label_bars(ax, bars, lambda v: f"{v:.0f} MB" if v >= 10 else f"{v:.1f} MB")
    ax.set_xticks(x, [LANG_NAME[lang] for lang in LANGS])
    axis_labels(ax, None, L("pico de memória (MB, RSS)", "peak memory (MB, RSS)"))
    save(f, "lang_memory")


def sandbox():
    rows = read("sandbox_overhead.csv")
    life = [float(r["ms"]) for r in rows if r["kind"] == "lifecycle"]
    agg = defaultdict(list)
    for r in rows:
        if r["kind"] != "lifecycle":
            agg[(r["lang"], r["kind"], r["mode"])].append(float(r["ms"]))
    med = {k: st.median(v) for k, v in agg.items()}
    SUMMARY["sandbox"] = {
        "box_lifecycle_ms_median": round(st.median(life), 1),
        **{f"{lang}_{kind}": {"bare_ms": round(med[(lang, kind, "bare")], 1),
                              "isolate_ms": round(med[(lang, kind, "isolate")], 1),
                              "overhead_ms": round(med[(lang, kind, "isolate")] - med[(lang, kind, "bare")], 1)}
           for lang in LANGS for kind in ("hello", "cpu")}}
    f, ax = fig()
    x = np.arange(len(LANGS))
    over = [med[(lang, "hello", "isolate")] - med[(lang, "hello", "bare")] for lang in LANGS]
    bars = ax.bar(x, [max(o, 0) for o in over], 0.55, color=T["accent"])
    for b, o, lang in zip(bars, over, LANGS):
        txt = f"+{o:.0f} ms" if o > 0 else L("≈ 0 (ruído)", "≈ 0 (noise)")
        ax.annotate(txt, (b.get_x() + b.get_width() / 2, max(o, 0)), xytext=(0, 4), textcoords="offset points",
                    ha="center", fontsize=14, color=T["text"])
    ax.axhline(st.median(life), color=T["muted"], linestyle="--", linewidth=1)
    ax.annotate(L(f"só criar + destruir a caixa: {st.median(life):.1f} ms", f"box init + cleanup only: {st.median(life):.1f} ms"),
                (-0.4, st.median(life)), xytext=(0, 5), textcoords="offset points", ha="left", fontsize=12,
                color=T["muted"], zorder=5, bbox=dict(facecolor=T["surface"], edgecolor="none", pad=2))
    ax.set_xticks(x, [LANG_NAME[lang] for lang in LANGS])
    axis_labels(ax, None, L("custo extra do isolate por execução (ms)", "extra cost of isolate per run (ms)"))
    save(f, "sandbox_overhead")


VERDICTS = ["PASSED", "WRONG_ANSWER", "TIME_LIMIT_EXCEEDED", "MEMORY_LIMIT_EXCEEDED", "COMPILATION_ERROR",
            "RUNTIME_ERROR"]
V_SHORT = {"PASSED": "AC", "WRONG_ANSWER": "WA", "TIME_LIMIT_EXCEEDED": "TLE", "MEMORY_LIMIT_EXCEEDED": "MLE",
           "COMPILATION_ERROR": "CE", "RUNTIME_ERROR": "RE", "ERROR": L("ERRO", "ERROR")}


def verdicts():
    V_SHORT["ERROR"] = L("ERRO", "ERROR")
    rows = read("verdicts.csv")
    cols = VERDICTS + ["ERROR"]
    m = np.zeros((len(VERDICTS), len(cols)), dtype=int)
    for r in rows:
        m[VERDICTS.index(r["expected"]), cols.index(r["got"]) if r["got"] in cols else -1] += 1
    correct = sum(m[i, i] for i in range(len(VERDICTS)))
    SUMMARY["verdicts"] = {
        "programs": len(rows), "correct": int(correct), "accuracy": round(correct / len(rows), 3),
        "per_verdict_recall": {V_SHORT[v] if v != "ERROR" else "ERROR": round(m[i, i] / m[i].sum(), 3)
                               for i, v in enumerate(VERDICTS)},
        "matrix_rows_expected_cols_got": {"cols": [V_SHORT[c] for c in cols], "rows": m.tolist()},
        "misclassified": [{k: r[k] for k in ("lang", "expected", "variant", "got", "error")}
                          for r in rows if r["expected"] != r["got"]],
    }
    f, ax = fig(11.5, 5.6)
    ax.yaxis.grid(False)
    from matplotlib.colors import LinearSegmentedColormap
    low = "#f4f4f2"
    cmap = LinearSegmentedColormap.from_list("v", [low, T["series"][0]])
    ax.imshow(m, cmap=cmap, vmin=0, vmax=m.max(), aspect="auto")
    for i in range(m.shape[0]):
        for j in range(m.shape[1]):
            if m[i, j]:
                ax.text(j, i, str(m[i, j]), ha="center", va="center", fontsize=17, fontweight="bold",
                        color="#ffffff" if m[i, j] > m.max() * 0.5 else T["text"])
    ax.set_xticks(np.arange(-0.5, len(cols)), minor=True)
    ax.set_yticks(np.arange(-0.5, len(VERDICTS)), minor=True)
    ax.grid(which="minor", color=T["surface"], linewidth=3)
    ax.tick_params(which="minor", length=0)
    ax.set_xticks(range(len(cols)), [V_SHORT[c] for c in cols])
    ax.set_yticks(range(len(VERDICTS)), [V_SHORT[v] for v in VERDICTS])
    axis_labels(ax, L("veredito dado pelo judge", "verdict given by the judge"),
                L("veredito esperado (12 programas cada)", "intended verdict (12 programs each)"))
    for s in ax.spines.values():
        s.set_visible(False)
    save(f, "verdict_confusion")


def regrade():
    sources = json.loads((RES / "regrade_sources.json").read_text())
    rows6 = read("regrade_eps1e-6.csv")
    rows3 = {r["id"]: r for r in read("regrade_eps1e-3.csv")}
    kinds = defaultdict(list)
    for r in rows6:
        kinds[r["source"]].append(r)
    hist = [r for r in rows6 if not r["source"].startswith("synthetic")]
    acc = lambda rs, mode: sum(r[mode] == "true" for r in rs)  # noqa: E731
    SUMMARY["regrade"] = {
        "sources": sources,
        "historical_mismatches": len(hist),
        "historical_accepted": {m: acc(hist, m) for m in ("exact", "tokens", "float")},
        "synthetic": {k: {"n": len(v), "exact": acc(v, "exact"), "tokens": acc(v, "tokens"),
                          "float_1e-6": acc(v, "float"), "float_1e-3": acc([rows3[r["id"]] for r in v], "float")}
                      for k, v in kinds.items() if k.startswith("synthetic")},
    }
    order = ["trailing-space", "no-final-newline", "extra-blank-lines", "crlf", "newline-vs-space", "double-spaces",
             "float-format", "case-changed", "missing-last-token"]
    names = {"trailing-space": L("espaço no fim", "trailing space"),
             "no-final-newline": L("sem \\n final", "no final newline"),
             "extra-blank-lines": L("linhas em branco extras", "extra blank lines"),
             "crlf": "CRLF (Windows)", "newline-vs-space": L("quebra de linha × espaço", "newline vs space"),
             "double-spaces": L("espaços duplos", "double spaces"),
             "float-format": L("formato de float*", "float formatting*"),
             "case-changed": L("maiúsc./minúsc. (erro real)", "case changed (real error)"),
             "missing-last-token": L("falta um número (erro real)", "missing token (real error)")}
    # Kinds that only a few expected outputs can show (multi-token lines) stay
    # in the summary but are too small for a percentage bar.
    order = [k for k in order if len(kinds[f"synthetic:{k}"]) >= 5]
    f, ax = fig(12, 5.6)
    ax.yaxis.grid(False)
    ax.xaxis.grid(True, color=T["grid"], linewidth=0.8)
    y = np.arange(len(order))
    for i, (mode, lbl) in enumerate([("exact", "exact"), ("tokens", "tokens"), ("float", "float (ε=10⁻⁶)")]):
        vals = [100 * acc(kinds[f"synthetic:{k}"], mode) / len(kinds[f"synthetic:{k}"]) for k in order]
        ax.barh(y + (i - 1) * 0.27, vals, 0.25, color=T["series"][i], label=lbl)
    ax.set_yticks(y, [f"{names[k]} (n={len(kinds[f'synthetic:{k}'])})" for k in order])
    ax.invert_yaxis()
    ax.set_xlim(0, 100)
    axis_labels(ax, L("% aceito como correto", "% accepted as correct"))
    legend(ax, loc="lower right")
    save(f, "compare_modes")


# ------------------------------------------------------------- web -----


def roc(pos, neg):
    ths = sorted(set(pos + neg + [0.0, 1.01]), reverse=True)
    pts = []
    for t in ths:
        tpr = sum(p >= t for p in pos) / len(pos)
        fpr = sum(n >= t for n in neg) / len(neg)
        pts.append((fpr, tpr, t))
    auc = 0.0
    for (x0, y0, _), (x1, y1, _) in zip(pts, pts[1:]):
        auc += (x1 - x0) * (y0 + y1) / 2
    return pts, auc


def plagiarism():
    rows = read("plagiarism_quality.csv")
    levels = ["rename", "reformat", "comments", "reorder", "deadcode", "combined", "independent", "unrelated"]
    names = {"rename": L("renomear", "rename"), "reformat": L("reformatar", "reformat"),
             "comments": L("comentários", "comments"), "reorder": L("reordenar", "reorder"),
             "deadcode": L("código morto", "dead code"), "combined": L("tudo junto", "combined"),
             "independent": L("outro autor,\nmesmo problema", "other author,\nsame problem"),
             "unrelated": L("outro\nproblema", "other\nproblem")}
    pair = defaultdict(list)
    cls = defaultdict(list)
    for r in rows:
        (pair if r["mode"] == "pair" else cls)[r["level"]].append(float(r["similarity"]))

    pos = [s for lv in levels[:6] for s in pair[lv]]
    neg_hard = pair["independent"]
    neg = neg_hard + pair["unrelated"]
    pts, auc = roc(pos, neg)
    pts_h, auc_h = roc(pos, neg_hard)
    cpos = [s for lv in levels[:6] for s in cls[lv]]
    cpts, cauc = roc(cpos, cls["independent"])

    def best(pts_, pos_, neg_):
        bestf = None
        for fpr, tpr, t in pts_:
            tp = tpr * len(pos_)
            fp = fpr * len(neg_)
            prec = tp / (tp + fp) if tp + fp else 1.0
            f1 = 2 * prec * tpr / (prec + tpr) if prec + tpr else 0
            if bestf is None or f1 > bestf["f1"]:
                bestf = {"threshold": round(t, 3), "precision": round(prec, 3), "recall": round(tpr, 3),
                         "f1": round(f1, 3), "fpr": round(fpr, 3)}
        return bestf

    def at(pts_, pos_, neg_, t):
        tp = sum(p >= t for p in pos_)
        fp = sum(n >= t for n in neg_)
        return {"threshold": t, "precision": round(tp / (tp + fp), 3) if tp + fp else None,
                "recall": round(tp / len(pos_), 3), "fpr": round(fp / len(neg_), 3)}

    SUMMARY["plagiarism_quality"] = {
        "copies": len(pos), "negatives_same_problem": len(neg_hard), "negatives_other_problem": len(pair["unrelated"]),
        "median_by_level_pair": {lv: round(st.median(pair[lv]), 3) for lv in levels},
        "min_by_level_pair": {lv: round(min(pair[lv]), 3) for lv in levels},
        "median_by_level_class": {lv: round(st.median(cls[lv]), 3) for lv in levels if cls[lv]},
        "max_independent_class": round(max(cls["independent"]), 3),
        "auc_pair_all_negatives": round(auc, 3), "auc_pair_same_problem": round(auc_h, 3),
        "auc_class_mode": round(cauc, 3),
        "best_f1_pair": best(pts, pos, neg), "best_f1_class": best(cpts, cpos, cls["independent"]),
        "at_0.5_pair": at(pts, pos, neg, 0.5), "at_0.5_class": at(cpts, cpos, cls["independent"], 0.5),
    }

    f, ax = fig(13, 5.8)
    data = [pair[lv] for lv in levels]
    bp = ax.boxplot(data, patch_artist=True, widths=0.5, medianprops=dict(color=T["text"], linewidth=2),
                    whiskerprops=dict(color=T["muted"]), capprops=dict(color=T["muted"]),
                    flierprops=dict(marker="o", markersize=5, markerfacecolor=T["muted"], markeredgecolor="none"))
    for i, b in enumerate(bp["boxes"]):
        b.set_facecolor(T["series"][0] if i < 6 else T["series"][1])
        b.set_edgecolor(T["surface"])
    thr = SUMMARY["plagiarism_quality"]["best_f1_pair"]["threshold"]
    ax.axhline(thr, color=T["muted"], linestyle="--", linewidth=1)
    ax.annotate(L(f"limiar {thr:.2f}", f"threshold {thr:.2f}"), (8.45, thr), xytext=(0, 5),
                textcoords="offset points", ha="right", fontsize=12, color=T["muted"])
    ax.set_xticks(range(1, len(levels) + 1), [names[lv] for lv in levels], fontsize=12)
    ax.set_ylim(0, 1.05)
    axis_labels(ax, None, L("similaridade (0–1)", "similarity (0–1)"))
    ax.annotate(L("cópias ofuscadas", "obfuscated copies"), (3.5, 1.04), ha="center", fontsize=13,
                color=T["series"][0])
    ax.annotate(L("não são cópias", "not copies"), (7.5, 1.04), ha="center", fontsize=13, color=T["series"][1])
    save(f, "plagiarism_levels")

    f, ax = fig(11, 5.4)
    ax.plot([0, 1], [0, 1], color=T["grid"], linestyle="--", linewidth=1)
    for i, (p, a, lbl) in enumerate([(pts, auc, L("par a par, todos os negativos", "pairwise, all negatives")),
                                     (pts_h, auc_h, L("par a par, mesmo problema", "pairwise, same problem")),
                                     (cpts, cauc, L("relatório da turma (filtro de\nboilerplate)",
                                                    "class report (boilerplate\nfilter)"))]):
        ax.plot([q[0] for q in p], [q[1] for q in p], color=T["series"][i], linewidth=2,
                label=f"{lbl}  AUC {a:.3f}")
    ax.set_xlim(-0.01, 1)
    ax.set_ylim(0, 1.01)
    axis_labels(ax, L("taxa de falsos positivos", "false positive rate"),
                L("taxa de verdadeiros positivos", "true positive rate"))
    legend(ax, loc="lower right", fontsize=12)
    save(f, "plagiarism_roc")

    perf = read("plagiarism_perf.csv")
    agg = defaultdict(list)
    for r in perf:
        agg[(r["lang"], int(r["n"]))].append(float(r["ms"]))
    ns = sorted({int(r["n"]) for r in perf})
    SUMMARY["plagiarism_perf_ms_median"] = {lang: {str(n): round(st.median(agg[(lang, n)]), 1) for n in ns}
                                            for lang in ("python", "c", "java")}
    f, ax = fig()
    for i, lang in enumerate(("python", "c", "java")):
        ys = [st.median(agg[(lang, n)]) / 1000 for n in ns]
        ax.plot(ns, ys, color=T["series"][i], linewidth=2, marker="o", markersize=8,
                markeredgecolor=T["surface"], markeredgewidth=2, label=LANG_NAME[lang])
    ax.set_xticks(ns)
    ax.set_xlim(0, ns[-1] * 1.12)
    axis_labels(ax, L("alunos no exercício", "students in the exercise"),
                L("tempo do relatório (s)", "report time (s)"))
    legend(ax, loc="upper left")
    save(f, "plagiarism_perf")


def constraints():
    rows = read("constraints.csv")
    cats = ["real", "clean", "identifier", "string", "comment"]
    names = {"real": L("violação real", "real violation"), "clean": L("código limpo", "clean code"),
             "identifier": L("parte de um nome", "part of a name"), "string": L("dentro de string", "inside a string"),
             "comment": L("dentro de comentário", "inside a comment")}
    right = [sum(r["violates"] == r["flagged"] for r in rows if r["category"] == c) for c in cats]
    total = [sum(r["category"] == c for r in rows) for c in cats]
    traps = [r for r in rows if r["category"] in ("string", "comment")]
    clean_like = [r for r in rows if r["violates"] == "false"]
    SUMMARY["constraints"] = {
        "samples": len(rows), "correct": sum(right),
        "by_category": {c: {"correct": a, "total": b} for c, a, b in zip(cats, right, total)},
        "false_positive_rate": round(sum(r["flagged"] == "true" for r in clean_like) / len(clean_like), 3),
        "false_positive_rate_no_traps": round(
            sum(r["flagged"] == "true" for r in clean_like if r["category"] in ("clean", "identifier"))
            / sum(r["category"] in ("clean", "identifier") for r in clean_like), 3),
        "trap_errors": sum(r["violates"] != r["flagged"] for r in traps), "traps": len(traps)}
    f, ax = fig()
    x = np.arange(len(cats))
    b1 = ax.bar(x, right, 0.55, color=T["series"][0], label=L("acertou", "correct"))
    b2 = ax.bar(x, [t - r for t, r in zip(total, right)], 0.55, bottom=right, color=T["series"][1],
                label=L("errou", "wrong"))
    for i in range(len(cats)):
        ax.annotate(f"{right[i]}/{total[i]}", (i, total[i]), xytext=(0, 4), textcoords="offset points",
                    ha="center", fontsize=14, color=T["text"])
    ax.set_xticks(x, [names[c] for c in cats])
    axis_labels(ax, None, L("amostras", "samples"))
    legend(ax, loc="upper right")
    save(f, "constraints_accuracy")


def ai():
    rows = read("ai_calls.csv")
    feats = ["tags", "narrative", "explain-hint", "review", "reference-solution"]
    names = {"tags": "tags", "narrative": L("narrativa", "narrative"), "explain-hint": L("Explicar (dica)", "Explain (hint)"),
             "review": L("revisão", "review"), "reference-solution": L("solução de\nreferência", "reference\nsolution")}
    by = defaultdict(list)
    for r in rows:
        if r["ok"] == "true":
            by[r["feature"]].append(float(r["ms"]) / 1000)
    models = Counter(r["model"] for r in rows)
    SUMMARY["ai"] = {
        "calls_logical": len(rows),
        "attempts_total": len(rows) + sum(int(r["failed_attempts"]) for r in rows),
        "answered_by_model": dict(models),
        "calls_with_fallback": sum(int(r["failed_attempts"]) > 0 for r in rows),
        "failed_calls": sum(r["ok"] != "true" for r in rows),
        "latency_s": {f: {"n": len(by[f]), "median": round(st.median(by[f]), 1), "p95": round(pct(by[f], .95), 1),
                          "max": round(max(by[f]), 1)} for f in feats if by[f]},
    }
    f, ax = fig()
    data = [by[f_] for f_ in feats]
    for i, d in enumerate(data):
        jitter = np.linspace(-0.12, 0.12, len(d)) if len(d) > 1 else [0]
        ax.scatter(np.full(len(d), i + 1) + jitter, d, s=60, color=T["series"][0], edgecolor=T["surface"],
                   linewidth=1.5, zorder=3)
        m = st.median(d)
        ax.plot([i + 0.7, i + 1.3], [m, m], color=T["text"], linewidth=2, zorder=4)
        ax.annotate(f"{m:.1f} s", (i + 1.32, m), va="center", fontsize=13, color=T["text"])
    ax.set_xticks(range(1, len(feats) + 1), [names[f_] for f_ in feats])
    ax.set_ylim(0, None)
    axis_labels(ax, None, L("segundos por chamada (traço = mediana)", "seconds per call (line = median)"))
    save(f, "ai_latency")

    grading = read("ai_reference_grading.csv")
    by_lang = defaultdict(list)
    for r in grading:
        by_lang[r["language"]].append(r["status"] == "PASSED")
    SUMMARY["ai_reference"] = {lang: {"passed": sum(v), "total": len(v)} for lang, v in by_lang.items()}
    model_of = {r["item"]: r["model"] for r in rows if r["feature"] == "reference-solution"}
    SUMMARY["ai_reference"]["failures"] = [dict(r, model=model_of.get(f"p{r['problem']}-{r['language']}"))
                                           for r in grading if r["status"] != "PASSED"]
    SUMMARY["ai_reference"]["answered_by_model"] = dict(Counter(model_of.values()))
    f, ax = fig(11, 5.4)
    langs = ["python", "c"]
    vals = [100 * sum(by_lang[lg]) / len(by_lang[lg]) for lg in langs]
    bars = ax.bar(range(2), vals, 0.5, color=T["accent"])
    for i, b in enumerate(bars):
        ax.annotate(f"{sum(by_lang[langs[i]])}/{len(by_lang[langs[i]])}", (i, b.get_height()), xytext=(0, 4),
                    textcoords="offset points", ha="center", fontsize=15, color=T["text"])
    ax.set_xticks(range(2), [LANG_NAME[lg] for lg in langs])
    ax.set_ylim(0, 110)
    axis_labels(ax, None, L("% que passa em todos os testes", "% passing every test"))
    save(f, "ai_reference")


def web_compute():
    rows = read("web_compute.csv")
    agg = defaultdict(list)
    meta = {}
    for r in rows:
        agg[(r["kind"], int(r["students"]))].append(float(r["ms"]))
        meta[(r["kind"], int(r["students"]))] = (int(r["items"]), int(r["records"]))
    SUMMARY["web_compute_ms_median"] = {
        f"{k}@{n}": {"ms": round(st.median(v), 2), "items": meta[(k, n)][0], "records": meta[(k, n)][1]}
        for (k, n), v in sorted(agg.items())}
    f, ax = fig()
    for i, kind in enumerate(("standings", "gradebook+csv")):
        ns = sorted(n for k, n in agg if k == kind)
        ys = [st.median(agg[(kind, n)]) for n in ns]
        lbl = L("placar do torneio", "contest standings") if kind == "standings" else L("boletim + CSV", "gradebook + CSV")
        ax.plot(ns, ys, color=T["series"][i], linewidth=2, marker="o", markersize=8, markeredgecolor=T["surface"],
                markeredgewidth=2, label=lbl)
        ax.annotate(f"{ys[-1]:.0f} ms", (ns[-1], ys[-1]), xytext=(10, 0), textcoords="offset points",
                    va="center", fontsize=13, color=T["text"])
    ax.set_xlim(0, 1150)
    axis_labels(ax, L("alunos", "students"), L("ms (mediana de 7)", "ms (median of 7)"))
    legend(ax, loc="upper left")
    save(f, "web_compute")


def ci():
    rows = read("ci_jobs.csv")
    jobs = ["enum-sync", "web", "judge"]
    by = {j: [float(r["duration_s"]) for r in rows if r["job"] == j] for j in jobs}
    runs = {r["run_id"]: float(r["run_wall_s"]) for r in rows}
    SUMMARY["ci"] = {"runs": len(runs), "run_wall_median_s": st.median(runs.values()),
                     "jobs": {j: {"n": len(v), "median_s": st.median(v), "max_s": max(v)} for j, v in by.items()},
                     "all_successful": all(r["job_conclusion"] == "success" for r in rows)}
    f, ax = fig()
    ax.yaxis.grid(False)
    ax.xaxis.grid(True, color=T["grid"], linewidth=0.8)
    for i, j in enumerate(jobs):
        d = by[j]
        jitter = np.linspace(-0.15, 0.15, len(d))
        ax.scatter(d, np.full(len(d), i) + jitter, s=60, color=T["series"][0], edgecolor=T["surface"], zorder=3)
        m = st.median(d)
        ax.plot([m, m], [i - 0.3, i + 0.3], color=T["text"], linewidth=2, zorder=4)
        ax.annotate(f"{m:.0f} s", (m, i + 0.32), ha="center", va="bottom", fontsize=13, color=T["text"])
    names = {"enum-sync": L("enums em sincronia", "enum sync"), "web": L("web (tipos + lint + testes)", "web (types + lint + tests)"),
             "judge": L("judge (fmt + clippy + testes)", "judge (fmt + clippy + tests)")}
    ax.set_yticks(range(len(jobs)), [names[j] for j in jobs])
    ax.set_xlim(0, None)
    axis_labels(ax, L(f"segundos por job ({len(runs)} execuções; traço = mediana)",
                      f"seconds per job ({len(runs)} runs; line = median)"))
    save(f, "ci_jobs")


def e2e():
    rows = read("e2e.csv")
    lc = SUMMARY["lang_cost_median"]
    out = {}
    for lang in LANGS:
        rs = [r for r in rows if r["lang"] == lang]
        queue = st.median(float(r["queue_ms"]) for r in rs)
        judging = st.median(float(r["judging_ms"]) for r in rs)
        compile_ms = lc[lang]["compile_ms"]
        run_ms = 5 * lc[lang]["run_hello_ms"]
        out[lang] = {"queue_ms": round(queue), "judging_ms": round(judging), "compile_ms": compile_ms,
                     "run_5_tests_ms": run_ms, "other_ms": max(0, round(judging - compile_ms - run_ms)),
                     "total_ms": round(queue + judging), "all_passed": all(r["status"] == "PASSED" for r in rs)}
    SUMMARY["e2e_ms_median"] = out
    f, ax = fig(12, 5.6)
    ax.yaxis.grid(False)
    ax.xaxis.grid(True, color=T["grid"], linewidth=0.8)
    stages = [("queue_ms", L("fila (NOTIFY → judge)", "queue (NOTIFY → judge)")),
              ("compile_ms", L("compilar", "compile")), ("run_5_tests_ms", L("rodar 5 testes", "run 5 tests")),
              ("other_ms", L("banco + resto", "DB + rest"))]
    y = np.arange(len(LANGS))
    left = np.zeros(len(LANGS))
    for i, (k, lbl) in enumerate(stages):
        vals = np.array([out[lang][k] / 1000 for lang in LANGS])
        ax.barh(y, vals, 0.6, left=left, color=T["series"][i], label=lbl, edgecolor=T["surface"], linewidth=2)
        left += vals
    for i, lang in enumerate(LANGS):
        ax.annotate(f"{out[lang]['total_ms'] / 1000:.2f} s", (left[i], i), xytext=(8, 0), textcoords="offset points",
                    va="center", fontsize=13, color=T["text"])
    ax.set_yticks(y, [LANG_NAME[lang] for lang in LANGS])
    ax.invert_yaxis()
    ax.set_xlim(0, left.max() * 1.15)
    axis_labels(ax, L("segundos, do envio ao veredito (mediana de 8)", "seconds, submit to verdict (median of 8)"))
    legend(ax, loc="lower center", bbox_to_anchor=(0.5, 1.0), ncol=4, fontsize=12)
    save(f, "e2e_stages")


def main():
    global T
    for name in ("deck", "light"):
        T = THEMES[name]
        for step in (concurrency, lang_cost, e2e, sandbox, verdicts, regrade, plagiarism, constraints, ai,
                     web_compute, ci):
            try:
                step()
            except FileNotFoundError as e:
                print(f"skip {step.__name__}: {e.filename} missing")
    tests = json.loads((RES / "tests.json").read_text())
    SUMMARY["tests"] = tests
    (RES / "summary.json").write_text(json.dumps(SUMMARY, indent=2, ensure_ascii=False))
    # The thesis (Overleaf) needs its figures inside overleaf/.
    figs = ROOT / "overleaf/figures"
    figs.mkdir(exist_ok=True)
    for png in THEMES["light"]["dir"].glob("*.png"):
        (figs / png.name).write_bytes(png.read_bytes())
    print("charts ->", OUT)


if __name__ == "__main__":
    main()
