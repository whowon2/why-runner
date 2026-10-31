#!/usr/bin/env python3
"""Build the TCC II presentation deck v5 (light theme) from v3's package.

    bench/.venv/bin/python docs/presentation/build_v5.py

Reads  "WhyRunner — Apresentação Parcial TCC II v3.pptx" (repo root, untouched)
Writes "WhyRunner — Apresentação TCC II v5.pptx"         (repo root)

v5 answers the review of v4:
- light theme: v3's theme slots keep their roles (bg1 = ink, tx2 = card
  surface, bg2 = muted text, accent6 = borders), only their colors change,
  and v4's few hard-coded dark hexes are remapped (LIGHT_HEX). Charts
  (bench/charts.py) and screenshots (shoot_v4.py) are light too;
- order: what the product does (professor, aluno, aulas, plágio) comes before
  how it works (arquitetura, judge) and how fast it is (desempenho);
- a clean title slide, an agenda, and a divider before each of the ten parts;
- walkthrough slides carry a step tracker (top right) and a title that says
  where the slide sits in the story;
- the related-work table states what each system does, from its sources;
- merged near-duplicates: the six one-verdict slides, the two AI-chain
  slides (v4 9 and 48), the CI pair and the technical limitations; dropped
  the slides that did not belong to the story (404 page, profile, themes,
  shortcut hint);
- a text-fit check (FIT) next to v4's word count; both print as LINT.
- after the classroom test (2026-10-29), part 09 shows its results (SUS chart and
  item chart from bench/charts.py survey(), open-answer themes, feedback -> fixes).

Builders shared with v4 are imported from build_v4.py; screenshots and charts
live in docs/presentation/{screenshots,charts}.
"""

import importlib.util
import json
import math
import re
import shutil
import sys
import tempfile
import zipfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
SRC = ROOT / "WhyRunner — Apresentação Parcial TCC II v3.pptx"
OUT = ROOT / "WhyRunner — Apresentação TCC II v5.pptx"

sys.dont_write_bytecode = True
_spec = importlib.util.spec_from_file_location("build_v4", HERE / "build_v4.py")
v4 = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(v4)
v3 = v4.v3
set_kicker, set_title, replace_text, set_notes = v3.set_kicker, v3.set_title, v3.replace_text, v3.set_notes
NS_REL, CT_SLIDE, CT_NOTES = v3.NS_REL, v3.CT_SLIDE, v3.CT_NOTES
fmt, ms, shot, chart = v4.fmt, v4.ms, v4.shot, v4.chart
SLIDE_W, TOP, BOTTOM = v4.SLIDE_W, v4.TOP, v4.BOTTOM
CC, LC, E2E, PQ, PP, VD, CS = v4.CC, v4.LC, v4.E2E, v4.PQ, v4.PP, v4.VD, v4.CS
AI, AIR, WC, CI, RG, SB, TESTS = v4.AI, v4.AIR, v4.WC, v4.CI, v4.RG, v4.SB, v4.TESTS
c100 = v4.c100
# classroom test 2026-10-29, aggregates from docs/evaluation/survey-review.md
SV = json.loads((ROOT / "bench/results/survey_lesson_student.json").read_text("utf-8"))

# Theme slot -> color. The slot names are v3's roles, not their usual meaning.
THEME = {"dk1": "FFFFFF",      # tx1: text on filled badges
         "lt1": "1F2328",      # bg1: ink (titles, body)
         "dk2": "F6F8FA",      # tx2: card and pill surface
         "lt2": "59636E",      # bg2: muted text
         "accent1": "1A7F37",  # green
         "accent2": "9A6700",  # amber
         "accent3": "CF222E",  # red
         "accent4": "8250DF",  # purple
         "accent5": "0969DA",  # blue
         "accent6": "D0D7DE",  # borders, frames
         "hlink": "1A7F37", "folHlink": "8250DF"}
BACKGROUND = "FFFFFF"
# v4's hard-coded dark-theme hexes (card fill, verdict colors) -> light.
LIGHT_HEX = {"151B23": "F6F8FA", "22C55E": "1A7F37", "F0566A": "CF222E", "F5A524": "BC4C00",
             "C084FC": "8250DF", "EAB308": "9A6700", "FB7185": "BF3989", "8B96A3": "59636E"}
VERDICT = {code: (name, LIGHT_HEX[col]) for code, (name, col) in v4.VERDICT.items()}
AMBER = "BC4C00"
GREEN_TINT = "E6F4EA"
MAX_BODY_WORDS = v4.MAX_BODY_WORDS


# ---------------------------------------------------------------- shapes ----


def text_lines(paras, w, size, mono, bold):
    """Rough line count: Calibri ~0.5 em per character, Courier New 0.6 em."""
    em = (0.6 if mono else 0.5) * (1.06 if bold and not mono else 1.0)
    per_line = max(1, int(w / (size / 72 * em)))
    if isinstance(paras, str):
        paras = [paras]
    n = 0
    for p in paras:
        flat = p if isinstance(p, str) else "".join(r if isinstance(r, str) else r[0] for r in
                                                     ([p] if isinstance(p, tuple) else p))
        n += max(1, math.ceil(len(flat) / per_line))
    return n


class S(v4.S):
    """v4's shapes plus a text-fit check, sized pills and a step tracker."""

    def __init__(self, start_id=20):
        super().__init__(start_id)
        self.overflow = []

    def text(self, x, y, w, h, paras, count=True, **kw):
        size = kw.get("size", 14)
        lines = text_lines(paras, w, size, kw.get("mono", False), kw.get("bold", False))
        if lines * size * 1.2 / 72 > h + 0.08:
            flat = paras if isinstance(paras, str) else str(paras)
            self.overflow.append(f"{lines} line(s) at {size}pt in {w:.2f}x{h:.2f}: {flat[:50]!r}")
        if x < 0.3 or x + w > SLIDE_W - 0.3:
            self.overflow.append(f"off the slide edge at x={x:.2f} w={w:.2f}")
        super().text(x, y, w, h, paras, count=count, **kw)

    def pills(self, labels, y, colors=None, size=16, h=0.55, x0=0.6, x1=SLIDE_W - 0.6):
        """One line each, width from the label (Courier New is 0.6 em); shrinks to fit the row."""
        gap = 0.35
        while True:
            widths = [0.6 + 0.6 * size / 72 * len(lab) for lab in labels]
            if sum(widths) + gap * (len(labels) - 1) <= x1 - x0 or size <= 12:
                break
            size -= 1
        x = x0 + (x1 - x0 - sum(widths) - gap * (len(labels) - 1)) / 2
        for i, (lab, w) in enumerate(zip(labels, widths)):
            col = (colors or ["accent1"] * len(labels))[i]
            self.box(x, y, w, h, fill="tx2", line=col, adj=50000)
            self.text(x, y, w, h, lab, size=size, color=col, bold=True, mono=True, align="ctr", anchor="ctr")
            x += w + gap

    def track(self, steps, current):
        """Where this slide sits in its section's walkthrough: small chips, right-aligned in the kicker row."""
        size = 10
        widths = [0.3 + 0.6 * size / 72 * len(s) for s in steps]
        gap = 0.12
        x = SLIDE_W - 0.6 - sum(widths) - gap * (len(steps) - 1)
        for i, (s, w) in enumerate(zip(steps, widths)):
            on = s == current
            self.box(x, 0.33, w, 0.3, fill="accent1" if on else "tx2", line="accent1" if on else "accent6",
                     adj=50000)
            self.text(x, 0.33, w, 0.3, s, size=size, color="tx1" if on else "bg2", bold=on, mono=True,
                      align="ctr", anchor="ctr", count=False)
            x += w + gap


# ------------------------------------------------------------- builders ----

AUTHOR = ["Juan Israel dos Anjos", "Orientadora: Suellen Mapa",
          "Bacharelado em Sistemas de Informação · IFMG Ouro Branco", "TCC II · outubro de 2026"]

PARTS = [("Introdução", "o problema e a pergunta"),
         ("Metodologia", "como o sistema foi construído"),
         ("O professor", "criar problemas e torneios"),
         ("O aluno", "resolver e entender o erro"),
         ("Aulas e turma", "listas com prazo e revisão"),
         ("Plágio", "quem copiou de quem"),
         ("Por dentro", "arquitetura e judge"),
         ("Desempenho", "benchmarks e testes"),
         ("Avaliação", "o que os alunos disseram"),
         ("Discussão", "limitações e próximos passos")]


def b_cover(s):
    s.text(0.9, 1.35, 7.4, 0.4, "$ whyrunner --tcc-ii", size=16, color="accent1", bold=True, mono=True,
           count=False)
    s.text(0.9, 1.85, 7.4, 1.2, "WhyRunner", size=66, bold=True, count=False)
    s.text(0.9, 3.15, 7.0, 1.0, "Um juiz online para o ensino de programação, com dicas de IA que o professor "
           "controla", size=22, color="bg2", count=False)
    s.text(0.9, 4.75, 7.4, 1.3, [[(AUTHOR[0], {"bold": True})]] + AUTHOR[1:], size=15, space_after=3,
           count=False)
    codes = list(VERDICT)
    for i, c in enumerate(codes):
        name, col = VERDICT[c]
        x, y = 8.85 + (i % 2) * 1.95, 1.6 + (i // 2) * 1.45
        s.box(x, y, 1.7, 1.15, fill="tx2", line=col, adj=12000)
        s.text(x, y, 1.7, 1.15, c, size=28, color=col, bold=True, mono=True, align="ctr", anchor="ctr",
               count=False)


def b_agenda(s):
    for i, (name, sub) in enumerate(PARTS):
        col, row = i // 5, i % 5
        x, y = 0.9 + col * 6.1, 1.85 + row * 0.95
        s.badge(x, y + 0.08, f"{i + 1:02d}", color="accent1", d=0.62, size=16)
        s.text(x + 0.85, y, 4.9, 0.42, name, size=22, bold=True, count=False)
        s.text(x + 0.85, y + 0.42, 4.9, 0.36, sub, size=15, color="bg2", count=False)


def b_divider(n):
    name, sub = PARTS[n - 1]

    def build(s):
        s.text(0.9, 2.0, 3.0, 2.0, f"{n:02d}", size=110, color="accent1", bold=True, mono=True, anchor="ctr",
               count=False)
        s.text(4.2, 2.25, 8.4, 0.9, name, size=44, bold=True, anchor="ctr", count=False)
        s.text(4.2, 3.2, 8.4, 0.6, sub, size=22, color="bg2", count=False)
        d, gap = 0.42, 0.5
        x = (SLIDE_W - 10 * d - 9 * gap) / 2
        for i in range(10):
            on = i + 1 == n
            done = i + 1 < n
            s.box(x + i * (d + gap), 5.3, d, d, fill="accent1" if on else ("tx2" if not done else "accent6"),
                  line="accent1" if on or done else "accent6", geom="ellipse")
            s.text(x + i * (d + gap) - 0.2, 5.3, d + 0.4, d, str(i + 1), size=11, bold=on,
                   color="tx1" if on else "bg2", align="ctr", anchor="ctr", count=False)
    return build


def b_question(s):
    s.box(1.4, 2.0, 10.5, 3.4, fill="tx2", line="accent1", adj=5000)
    s.text(1.4, 2.2, 10.5, 0.4, "PERGUNTA DE PESQUISA", size=14, color="accent1", bold=True, mono=True,
           align="ctr", count=False)
    s.text(1.9, 2.75, 9.5, 2.4, "Feedback por IA e atividades curadas pelo professor tornam um juiz online útil "
           "para ensinar programação?", size=30, bold=True, align="ctr", anchor="ctr")


# What each compared system does, from its own sources (notes cite them).
RELATED = [
    ("Ataux", "UFCG, 2021", "o Codeforces: o aluno envia lá", "as do Codeforces", "o veredito do Codeforces",
     "sim: listas com prazo e planilha de notas"),
    ("GOJ", "UnB", "juiz próprio (MOJ Tools)", "as do ICPC", "veredito no padrão ICPC",
     "não: acervo das maratonas da UnB"),
    ("Run Codes", "ICMC-USP", "juiz próprio, por casos de teste", "12, entre elas C, C++ e Java",
     "se a resposta está correta", "sim: disciplinas e exercícios"),
    ("BOCA", "USP, 2004", "juízes humanos; autojuiz só ajuda", "C, C++, Java, Kotlin e Python",
     "YES, ou NO com o motivo", "não: só competições"),
    ("WhyRunner", "este trabalho", "juiz próprio, no isolate", "C, C++, Java, Python, Rust e Portugol",
     "veredito, caso que falhou e dica de IA", "sim: aulas, prazo, revisão e boletim"),
]


def b_related(s):
    cols = [("Sistema", 1.85), ("Quem corrige", 2.6), ("Linguagens", 2.6), ("O aluno recebe", 2.6),
            ("Turmas e listas", 2.45)]
    x0, y0, hh, rh = 0.6, 1.6, 0.45, 0.8
    x = x0
    for name, w in cols:
        s.text(x + 0.1, y0, w - 0.2, hh, name, size=12, color="bg2", bold=True, mono=True, anchor="ctr",
               count=False)
        x += w
    for r, row in enumerate(RELATED):
        y = y0 + hh + r * rh
        ours = row[0] == "WhyRunner"
        s.box(x0, y + 0.04, sum(w for _, w in cols), rh - 0.08, fill=GREEN_TINT if ours else "tx2",
              line="accent1" if ours else "accent6", adj=8000)
        s.text(x0 + 0.15, y + 0.1, cols[0][1] - 0.2, 0.36, row[0], size=16, bold=True,
               color="accent1" if ours else "bg1", count=False)
        s.text(x0 + 0.15, y + 0.43, cols[0][1] - 0.2, 0.28, row[1], size=11, color="bg2", count=False)
        x = x0 + cols[0][1]
        for (name, w), cell in zip(cols[1:], row[2:]):
            s.text(x + 0.1, y + 0.04, w - 0.2, rh - 0.08, cell, size=14, anchor="ctr", count=False)
            x += w
    s.text(0.6, 6.25, SLIDE_W - 1.2, 0.5,
           "Fontes: TCCs do Ataux (UFCG) e do GOJ (UnB); código-fonte do BOCA (github.com/cassiopc/boca); "
           "Run Codes: Agência FAPESP (2015) e artigo da UFC (2022).", size=11, color="bg2", count=False)


def b_unique(s):
    s.pills(["dicas de IA", "restrição de como resolver", "blocos e Parsons"], 3.3, size=20, h=0.75)
    s.caption("Turmas e listas com prazo o Ataux e o Run Codes também têm.", y=4.6)


def b_cycles(s):
    rows = [("Fila", "BullMQ → AWS SQS", "PostgreSQL LISTEN/NOTIFY"),
            ("Backend", "API NestJS separada", "Server Actions do Next.js"),
            ("Banco", "Supabase", "PostgreSQL + Drizzle"),
            ("Sandbox", "Docker por envio", "isolate, o sandbox da IOI")]
    s.text(2.6, 1.75, 4.0, 0.3, "TENTADO", size=11, color="bg2", bold=True, mono=True, count=False)
    s.text(7.4, 1.75, 4.5, 0.3, "ADOTADO", size=11, color="accent1", bold=True, mono=True, count=False)
    for i, (k, a, b) in enumerate(rows):
        y = 2.1 + i * 0.78
        s.box(0.9, y, 11.5, 0.64)
        s.text(1.1, y, 1.5, 0.64, k, size=16, bold=True, anchor="ctr")
        s.text(2.6, y, 4.0, 0.64, a, size=16, color="bg2", anchor="ctr")
        s.arrow(6.55, y + 0.32, 7.2, y + 0.32, color="accent1")
        s.text(7.4, y, 4.9, 0.64, b, size=16, color="accent1", bold=True, anchor="ctr")
    s.pills(["levantamento: literatura, alunos e experiência", "MVP testado no Discord"], 5.5,
            colors=["accent2", "accent2"], size=14, h=0.5, x0=0.9, x1=12.4)


def b_pilot_liked(s):
    s.pills(["tema escuro, estilo terminal", "o nome: “Why” = “Uai”"], 3.2, size=20, h=0.75)


def b_arch(s):
    s.flow([("Navegador", "React · TanStack Query"), ("Next.js", "Server Actions"),
            ("PostgreSQL", "LISTEN / NOTIFY", "accent5"), ("Judge", "Rust · tokio · sqlx"),
            ("isolate", "sem rede · limites", "accent1")], 2.4, h=1.3)
    w = (SLIDE_W - 1.2 - 0.55 * 4) / 5
    x = 0.6 + w + 0.55
    s.arrow(x + w / 2, 3.75, x + w / 2, 4.3, color="accent4")
    s.card(x - 0.3, 4.35, w + 0.6, 1.0, "IA", "cadeia de três modelos", line="accent4", size=18)
    s.caption("O site grava o envio; o judge escuta, executa e grava o veredito.", y=6.0)


def b_ai_chain(s):
    m = AI["answered_by_model"]
    s.flow([("Gemini 3.5 Flash", "principal", "accent4"), ("Flash-Lite", "fallback 1", "accent4"),
            ("Claude Haiku 5.5", "fallback 2", "accent4", "dash")], 2.2, h=1.3, x0=1.2, x1=12.1,
           color="accent4", labels=["falhou", "falhou"])
    w = (12.1 - 1.2 - 0.55 * 2) / 3
    for i, k in enumerate(["gemini-3.5-flash", "gemini-3.5-flash-lite", "claude-haiku-5-5"]):
        x = 1.2 + i * (w + 0.55)
        s.text(x, 3.75, w, 0.9, str(m.get(k, 0)), size=44, color="accent4", bold=True, align="ctr",
               anchor="ctr", count=False)
        s.text(x, 4.65, w, 0.4, "respostas", size=15, color="bg2", align="ctr", count=False)
    s.caption(f"{AI['calls_logical']} chamadas no benchmark · {AI['failed_calls']} sem resposta", y=5.6)


def b_verdicts(s):
    lines = {"AC": "passou em todos os casos", "WA": "saída diferente da esperada",
             "TLE": "não terminou no limite", "MLE": "pediu memória demais",
             "CE": "não compilou", "RE": "quebrou durante a execução"}
    for i, c in enumerate(VERDICT):
        name, col = VERDICT[c]
        x, y = 0.9 + (i % 3) * 3.95, 2.0 + (i // 3) * 2.0
        s.box(x, y, 1.6, 1.0, fill="tx2", line=col, adj=12000)
        s.text(x, y, 1.6, 1.0, c, size=26, color=col, bold=True, mono=True, align="ctr", anchor="ctr", count=False)
        s.text(x + 1.75, y + 0.02, 2.05, 0.4, name, size=14, bold=True, count=False)
        s.text(x + 1.75, y + 0.42, 2.05, 0.6, lines[c], size=13, color="bg2", count=False)
    s.caption("Antes, o judge só dizia “passou” ou “falhou”.", y=6.1)


def b_legend(s):
    s.box(2.0, 2.3, 2.2, 1.6, fill="1A7F37", line="1A7F37", adj=8000)
    s.text(2.0, 2.3, 2.2, 1.6, ["2", [("22'", {"size": 20})]], size=40, color="FFFFFF", bold=True, align="ctr",
           anchor="ctr", count=False)
    s.text(3.95, 2.1, 0.5, 0.5, "★", size=30, color=AMBER, count=False)
    s.text(4.9, 2.3, 7.4, 1.6, [[("2", {"bold": True, "color": "accent1"}), " tentativas"],
                                [("22'", {"bold": True, "color": "accent1"}), " minuto do acerto"],
                                [("★", {"bold": True, "color": AMBER}), " primeiro a resolver"]],
           size=22, anchor="ctr")


def b_bench_setup(s):
    cards = [("Ryzen 5 5600", "6 núcleos · 12 threads"), ("32 GB", "RAM · CachyOS"),
             ("Docker", "imagem de produção + PostgreSQL"), ("bench/", "scripts e dados brutos")]
    w, gap = 2.7, 0.3
    x = (SLIDE_W - 4 * w - 3 * gap) / 2
    for i, (a, b) in enumerate(cards):
        s.card(x + i * (w + gap), 2.5, w, 1.6, a, b, line="accent1" if i == 3 else "accent6", size=20,
               sub_size=13, count=True)
    s.caption("Cada número dos próximos slides sai de um script do repositório.", y=4.9)


def b_ci(s):
    s.card(4.9, 1.9, 3.5, 0.9, "push / pull request", size=18, line="accent5")
    jobs = [("web", "tipos · lint · testes"), ("judge", "fmt · clippy · testes"), ("enum-sync", "Rust ⇄ Drizzle")]
    for i, (j, sub) in enumerate(jobs):
        x = 1.2 + i * 3.8
        s.arrow(6.65, 2.85, x + 1.5, 3.55, color="accent6")
        s.card(x, 3.6, 3.0, 1.4, j, sub, line="accent1", size=22)
    s.caption(f"Em paralelo · cerca de {fmt(CI['run_wall_median_s'], 0)} s por push · {CI['runs']} execuções, "
              "todas verdes", y=5.6)


def b_limit(text):
    def build(s):
        s.box(5.9, 2.0, 1.5, 1.5, fill=AMBER, line=AMBER, geom="ellipse")
        s.text(5.9, 2.0, 1.5, 1.5, "!", size=60, color="FFFFFF", bold=True, align="ctr", anchor="ctr",
               count=False)
        s.text(1.0, 3.9, SLIDE_W - 2.0, 1.0, text, size=24, align="ctr", anchor="ctr")
    return build


def b_limits(s):
    rows = [("produção", "1 vCPU na Fly.io: mais workers não ajudam"),
            ("Portugol", "erros saem com código 0 e viram WA"),
            ("memória", "MLE é heurística, sem cgroups"),
            ("restrições", "leem texto, não a árvore do código"),
            ("plágio", "só na mesma linguagem; não pega IA")]
    for i, (k, t) in enumerate(rows):
        y = 1.85 + i * 0.86
        s.box(1.3, y, 10.7, 0.7)
        s.box(1.45, y + 0.13, 0.44, 0.44, fill=AMBER, line=AMBER, geom="ellipse")
        s.text(1.45, y + 0.13, 0.44, 0.44, "!", size=16, color="FFFFFF", bold=True, align="ctr", anchor="ctr",
               count=False)
        s.text(2.15, y, 2.1, 0.7, k, size=17, bold=True, mono=True, color=AMBER, anchor="ctr", count=False)
        s.text(4.35, y, 7.5, 0.7, t, size=18, anchor="ctr")


def b_quotes(items):
    """Two open-answer themes: approximate mention count, theme, one student quote."""
    def build(s):
        w, gap = 5.4, 0.5
        x0 = (SLIDE_W - len(items) * w - (len(items) - 1) * gap) / 2
        for i, (num, label, quote, col) in enumerate(items):
            x = x0 + i * (w + gap)
            s.box(x, 1.9, w, 4.1, fill="tx2", line=col, adj=5000)
            s.text(x, 2.1, w, 1.3, num, size=66, color=col, bold=True, align="ctr", anchor="ctr", count=False)
            s.text(x, 3.45, w, 0.5, label, size=24, bold=True, align="ctr")
            s.text(x + 0.4, 4.25, w - 0.8, 1.2, f"“{quote}”", size=18, color="bg2", align="ctr", count=False)
        s.caption("menções na pergunta aberta (30 respostas)", y=6.25)
    return build


FIXES = [("tela pequena", "tela cheia e tamanho da fonte", "#81"),
         ("não via a saída nem o erro", "entrada, saída, esperado e traceback", "#83"),
         ("texto da IA não rolava", "painel rolável, ou ao lado do código", "#88"),
         ("trocar idioma apagava o código", "rascunho salvo no navegador", "#88"),
         ("rodar antes de enviar", "botão Executar, com entrada própria", "#89")]


def b_fixes(s):
    s.text(1.1, 1.7, 4.2, 0.3, "OS ALUNOS DISSERAM", size=11, color="bg2", bold=True, mono=True, count=False)
    s.text(6.1, 1.7, 4.8, 0.3, "MUDOU", size=11, color="accent1", bold=True, mono=True, count=False)
    rows = FIXES + [("saída idêntica", "modo tokens: próximo passo", "")]
    for i, (said, change, pr) in enumerate(rows):
        y = 2.05 + i * 0.64
        todo = not pr
        s.box(0.9, y, 11.5, 0.54, line=AMBER if todo else "accent6")
        s.text(1.1, y, 4.3, 0.54, said, size=15, anchor="ctr")
        s.arrow(5.4, y + 0.27, 5.95, y + 0.27, color=AMBER if todo else "accent1")
        s.text(6.1, y, 4.9, 0.54, change, size=15, bold=True, color=AMBER if todo else "accent1", anchor="ctr")
        if pr:
            s.text(11.1, y, 1.2, 0.54, pr, size=13, color="bg2", mono=True, align="r", anchor="ctr", count=False)


def b_future(s):
    s.pills(["torneio e professor em sala", "saída por tokens"], 2.9, size=18, h=0.7)
    s.pills(["detectar código de IA", "isolate com cgroups"], 3.9, size=18, h=0.7, colors=["bg2", "bg2"])


def b_cronograma(s):
    steps_ = [("Teste em sala", "29/10 ✓", True), ("Correções", "30/10 ✓", True), ("Defesa", "", False)]
    xs = [2.0, 5.95, 9.9]
    for i, ((a, b, done), x) in enumerate(zip(steps_, xs)):
        s.badge(x + 0.45, 2.4, str(i + 1), color="accent6" if done else "accent1", d=0.9, size=24)
        s.text(x - 0.6, 3.5, 2.9, 0.5, a, size=22, bold=True, align="ctr")
        if b:
            s.text(x - 0.6, 4.05, 2.9, 0.4, b, size=16, color="accent1", align="ctr")
        if i < 2:
            s.arrow(x + 1.45, 2.85, xs[i + 1] + 0.35, 2.85, color="accent6")


def b_thanks(s):
    s.text(0.8, 2.2, SLIDE_W - 1.6, 1.4, "Obrigado!", size=60, color="accent1", bold=True, align="ctr",
           anchor="ctr", count=False)
    s.text(0.8, 3.7, SLIDE_W - 1.6, 0.6, "Perguntas?", size=24, color="bg2", align="ctr", count=False)
    s.text(0.8, 5.0, SLIDE_W - 1.6, 0.4, "Juan Israel dos Anjos · Orientadora: Suellen Mapa · IFMG Ouro Branco",
           size=14, color="bg2", align="ctr", count=False)


# ---------------------------------------------------------------- slides ----

SLIDES = []  # (kind, ref, kicker, title, builder, notes, track, max_words)
STATE = {"kicker": "", "steps": None}


def part(n):
    name = PARTS[n - 1][0]
    STATE["kicker"] = f"{n:02d} · {name.upper()}"
    STATE["steps"] = None
    SLIDES.append(("new", None, f"PARTE {n:02d} DE {len(PARTS)}", "", b_divider(n),
                   f"Parte {n}: {name}, {PARTS[n - 1][1]}.", None, 0))


def steps(*names):
    STATE["steps"] = list(names)


def add(title, builder, notes, step=None, kicker=None, max_words=MAX_BODY_WORDS):
    track = (STATE["steps"], step) if step else None
    SLIDES.append(("new", None, kicker if kicker is not None else STATE["kicker"], title, builder, notes, track,
                   max_words))


def reuse(n, kicker, editor, notes):
    SLIDES.append(("v3", n, kicker, None, editor, notes, None, 0))


# ---- abertura
add("", b_cover,
    "Boa tarde. Eu sou o Juan, e este é o WhyRunner: um juiz online para o ensino de programação, com dicas de "
    "IA que o professor controla. As seis siglas à direita são os vereditos que o sistema devolve; vamos voltar "
    "a elas.", kicker="")
add("Roteiro da apresentação", b_agenda,
    "O roteiro: primeiro o problema e a pergunta de pesquisa, depois como o sistema foi construído. Em seguida "
    "o produto, na ordem em que ele é usado: o professor, o aluno, as aulas da turma e a detecção de plágio. Só "
    "então como ele funciona por dentro, o desempenho medido, o que os alunos disseram no teste em sala, e por fim limitações "
    "e próximos passos.", kicker="ROTEIRO", max_words=60)

# ---- 1 introdução
part(1)
add("Juízes online corrigem código; ensinar é outra coisa", v4.b_wrong_answer,
    "Um juiz online recebe o código, roda contra casos de teste e devolve um veredito. Em sistemas como o BOCA, "
    "o aluno vê só isto: resposta errada, sem explicação. Para quem está aprendendo, isso não ensina nada. Foi a "
    "minha experiência em maratonas de programação usando esses sistemas como aluno.")
add("A pergunta que guia o trabalho", b_question,
    "Daí a pergunta de pesquisa: será que feedback gerado por IA, somado a atividades montadas pelo professor, "
    "torna um juiz online mais útil para o ensino? O resto da apresentação mostra o que foi construído para "
    "responder isso, e o que uma turma achou dele.", max_words=20)
add("O objetivo é um juiz online feito para a sala de aula", v4.b_goal,
    "O objetivo geral é desenvolver e avaliar um juiz online voltado ao ensino. Três pilares: executar código com "
    "segurança em várias linguagens; explicar o erro, com dicas de IA que não entregam a solução; e deixar o "
    "professor no controle, montando aulas, torneios e decidindo quanto a IA ajuda.")
add("Como os sistemas analisados funcionam", b_related,
    "Analisei quatro sistemas. O Ataux, TCC da UFCG de 2021, não tem juiz próprio: o professor monta listas por "
    "turma com problemas do Codeforces, o aluno envia lá, e o Ataux sincroniza os vereditos pela API do "
    "Codeforces e gera a planilha de notas, com desconto por atraso; detecção de plágio ficou como trabalho "
    "futuro. O Gamma Online Judge, da UnB, guarda e julga os problemas das maratonas da UnB, com as linguagens "
    "do ICPC e vereditos no padrão ICPC, usando o MOJ Tools; a versão de 2023 acrescentou contests virtuais, mas "
    "não há turmas. O Run Codes, criado no ICMC-USP, tem disciplinas e exercícios com correção automática por "
    "casos de teste e suporta doze linguagens, segundo um artigo da UFC de 2022; hoje, 28 de outubro, o domínio "
    "run.codes aparece à venda. O BOCA, de 2004, é o sistema da Maratona da SBC: por padrão aceita C, C++, Java, "
    "Kotlin e Python, e responde YES ou NO com o motivo, como Wrong answer ou Time limit exceeded; o autojuiz só "
    "prepara a correção, quem confirma o veredito é um juiz humano. Nenhum deles explica o erro.",
    max_words=200)
add("O que nenhum dos quatro oferece", b_unique,
    "Resumindo a tabela: turmas e listas com prazo não são novidade, o Ataux e o Run Codes têm. O diferencial "
    "está em três coisas. Dicas por IA, sob controle do professor. Restrições de como resolver, por exemplo "
    "proibir laço aninhado ou exigir um algoritmo. E blocos e Parsons em Portugol, para quem nunca programou.",
    max_words=24)

# ---- 2 metodologia
part(2)
add("Ciclos iterativos: cada versão corrigiu a anterior", b_cycles,
    "O desenvolvimento foi iterativo, a partir de um levantamento na literatura, de conversas com alunos e da "
    "minha experiência. A fila começou com BullMQ e depois AWS SQS, e terminou no próprio PostgreSQL com LISTEN "
    "e NOTIFY. O backend NestJS separado virou Server Actions do Next.js. O Supabase virou PostgreSQL com "
    "Drizzle. E a execução em contêiner Docker por envio virou o isolate, o sandbox da IOI. Um MVP foi testado "
    "informalmente no Discord.", max_words=40)
add("Um teste informal com colegas orientou as mudanças", v4.b_pilot_intro,
    "Esse MVP: cinco colegas usaram o sistema no meu servidor do Discord, sem roteiro nem questionário. É um "
    "teste informal, não a avaliação.")
add("O que incomodou virou mudança", v4.b_pilot_changes,
    "Três reclamações viraram mudanças: o torneio não mostrava o código de cada tentativa; o placar só mostrava "
    "medalhas; e o erro de importar JSON dizia só Invalid format. Todas foram corrigidas antes da versão 3.")
add("Do lado bom, gostaram do visual e do nome", b_pilot_liked,
    "Do lado bom: o visual estilo terminal, e o nome. O Why lido como o uai mineiro, que é justamente a ideia de "
    "explicar por que o código falhou. A seguir, o sistema como ele é hoje, começando pelo professor.")

# ---- 3 professor
part(3)
steps("banco", "problema", "IA", "torneio", "placar")
add("Tudo começa no banco de problemas, com busca por código, tema e dificuldade",
    shot("lista-problemas-filtros.png"),
    "O professor começa pelo banco de problemas: busca por título ou pelo código do problema, como DEMO-101, "
    "filtro por dificuldade, por tags agrupadas e só pelos meus problemas.", step="banco")
add("Problemas prontos entram em lote, por um arquivo JSON", shot("v4-problem-import.png"),
    "Quem já tem uma lista pronta importa vários problemas de uma vez a partir de um arquivo JSON, com o formato "
    "documentado na própria tela e um modelo para baixar. Erro de formato aponta o problema e o campo.",
    step="banco")
add("Ao criar um problema, ele só é publicado com uma solução que passa", shot("validacao-aprovada.png"),
    "Quando o problema é novo, antes de publicar o autor precisa provar que os casos de teste estão certos: "
    "escolhe uma linguagem, cola uma solução de referência ou pede para a IA gerar uma, e o judge roda a solução "
    "contra todos os casos. Se alguma saída não bate, o erro está no caso de teste. Se ele mudar um teste depois, "
    "a publicação trava até validar de novo.", step="problema")
add(f"A IA escreve essa solução: passou em {AIR['python']['passed'] + AIR['c']['passed']} de 20 problemas",
    chart("ai_reference", "Soluções de referência geradas pela IA, julgadas pelo judge"),
    f"Medi isso: pedi à IA soluções de referência em Python e em C para os dez problemas de exemplo e julguei "
    f"todas no judge. Python passou em {AIR['python']['passed']} de 10; C em {AIR['c']['passed']} de 10. As duas "
    f"falhas vieram do último modelo da cadeia, o Claude Haiku, que escreveu uma frase antes do código, apesar da "
    f"instrução; não compilou. É exatamente o caso que a validação antes de publicar existe para pegar.",
    step="IA")
add("A IA também sugere a narrativa e as tags do problema", shot("ia-narrativa-tags.png"),
    "Mais duas ajudas de IA na criação: a narrativa, uma pequena história no estilo do Advent of Code para "
    "contextualizar o enunciado; e as tags, de um catálogo fixo de temas. As duas só preenchem o formulário; nada "
    "é salvo sem o professor.", step="IA")
add("E aponta casos de borda que faltam nos testes", shot("ia-revisao-casos-borda.png"),
    "A revisão com IA lê o enunciado e os casos de teste e sugere casos de borda que faltam; aqui, o menor primo "
    "e o menor número composto. Cada sugestão entra nos testes com um clique.", step="IA")
add("Antes de publicar, o professor vê o problema como o aluno vai ver", shot("previsualizacao.png"),
    "A pré-visualização mostra o enunciado renderizado, com Markdown e LaTeX e a narrativa, exatamente como o "
    "aluno vai ver.", step="problema")
add("Com os problemas prontos, o professor monta o torneio",
    shot("v4-contest-settings.png", "Nome, datas, privado e nível de IA"),
    "Com problemas no banco, o professor cria um torneio: nome, descrição, datas, se é privado e o nível máximo "
    "de ajuda da IA. A mudança de nível vale a partir do próximo pedido.", step="torneio")
add("Os problemas entram no torneio pelo código", shot("torneio-busca-codigo.png"),
    "Os problemas são buscados pelo código e viram A, B, C, D na ordem escolhida.", step="torneio")
add("No torneio privado, o professor aprova quem entra", shot("v4-contest-join-requests.png"),
    "Num torneio privado, o aluno pede para entrar e o professor aprova ou rejeita. O pedido gera uma "
    "notificação para o professor, e a aprovação uma para o aluno.", step="torneio")
add("O professor também decide quanto a IA ajuda no torneio", v4.b_ai_levels,
    "No torneio, a IA tem quatro níveis: desligada; conceito, que só nomeia a área do erro; dica, que explica o "
    "que está errado sem código; e precisa, que aponta a linha. O professor define o máximo, o servidor aplica, e "
    "o aluno libera um nível por vez.", step="torneio")
add("Durante o torneio, o placar segue o estilo das maratonas", shot("v4-standings.png"),
    "Com o torneio rodando, o professor acompanha o placar: em cada célula, as tentativas e o minuto do acerto; "
    "verde é resolvido, vermelho só tentativas erradas; e atualiza sozinho.", step="placar")
add("Cada célula conta tentativas, minuto e quem resolveu primeiro", b_legend,
    "Lendo uma célula: 2 tentativas, resolvido no minuto 22, e a estrela marca o primeiro a resolver aquele "
    "problema. Empate em número de problemas é desfeito pela penalidade: soma dos minutos dos acertos mais 20 "
    "por tentativa errada antes do acerto.", step="placar")

# ---- 4 aluno
part(4)
steps("início", "editor", "veredito", "dica", "avisos")
add("Do outro lado, o aluno entra e vê o que falta fazer", shot("v4-home.png"),
    "Agora o mesmo sistema visto pelo aluno. A tela inicial mostra exercícios pendentes da turma, o último "
    "torneio, o que resolveu recentemente e sugestões de problemas.", step="início")
add("Ele escreve a solução num editor que salva sozinho no navegador", shot("editor-autosave.png"),
    "O editor é o Monaco, o mesmo do VS Code, com destaque de sintaxe nas seis linguagens. O código é salvo no "
    "navegador por problema e linguagem, então fechar a aba não perde nada.", step="editor")
add("Cada tentativa recebe um veredito com nome e cor",
    shot("v4-verdicts-contest.png", "Seis tentativas, seis vereditos"),
    "Ao enviar, cada tentativa aparece com a hora, a linguagem e o veredito com a sua cor. Este aluno de "
    "demonstração errou, não compilou, estourou tempo, quebrou, estourou memória e por fim acertou. Os seis "
    "vereditos são explicados na parte do judge.", step="veredito")
add("Ao errar, ele vê o caso que falhou e pode pedir uma explicação", shot("submissoes-explicar.png"),
    "Cada envio guarda o código, então o aluno sabe qual versão deu qual veredito. Se o caso que falhou é um "
    "exemplo público, ele vê a entrada, a própria saída e a esperada; se é escondido, como aqui, vê só o número "
    "do caso, para não dar para extrair os testes. O botão Explicar pede à IA uma dica sobre o erro, dentro do "
    "nível que o professor liberou.", step="dica")
add("Notificações avisam o veredito e as aprovações", shot("v4-notifications.png"),
    "As notificações avisam quando um envio foi julgado, quando um pedido para entrar num torneio foi aprovado e "
    "quando uma nova aula foi liberada. Eventos repetidos se agrupam numa entrada só.", step="avisos")
add("Ctrl K abre uma busca que leva a qualquer lugar", shot("v4-command-palette.png"),
    "E a paleta de comandos: Ctrl K abre uma busca por problemas, páginas e ações, como criar turma. O atalho "
    "aparece no menu, ao lado do botão de busca.", step="avisos")

# ---- 5 aulas e turma
part(5)
steps("turma", "aula", "formatos", "restrições", "revisão", "notas")
add("Fora dos torneios, o aluno entra na turma com um código", shot("turma-codigo.png"),
    "Além dos torneios, o professor tem turmas. Para entrar, o aluno digita o código de seis letras da turma, "
    "aqui ALGV4D.", step="turma")
add("Cada aula da turma é uma lista de exercícios com prazo", shot("v4-class-lessons.png"),
    "Cada aula é uma lista de exercícios montada pelo professor com problemas do banco, com prazo. Depois do "
    "prazo o professor revisa as entregas.", step="aula")
add("Para quem nunca programou, a resposta pode ser em blocos", shot("formato-blocos.png"),
    "Cada exercício tem um formato. No modo blocos, no estilo Scratch, os blocos têm rótulos em português e viram "
    "Portugol, que roda no judge como qualquer outra linguagem; aqui, a entrega de um aluno com o código gerado "
    "embaixo.", step="formatos")
add("Ou em Parsons: ordenar e indentar as linhas certas", shot("formato-parsons.png"),
    "No modo Parsons, o aluno recebe as linhas da solução do professor, embaralhadas, e só ordena e indenta. A "
    "solução do professor precisa passar no judge antes de virar exercício.", step="formatos")
add("O professor pode exigir como resolver, não só o resultado", shot("solution-constraints.png"),
    "As restrições de solução: limite de laços aninhados, construções proibidas ou obrigatórias, e um algoritmo "
    "exigido, verificado pela IA. Uma solução correta que viola a restrição recebe um veredito próprio.",
    step="restrições")
add("Testado: restrições acertam código real e erram texto em strings e comentários",
    chart("constraints_accuracy", f"{CS['samples']} amostras rotuladas à mão"),
    f"As restrições estruturais analisam o texto do código, não uma árvore sintática. Medi com "
    f"{CS['samples']} amostras: violações reais, código limpo e nomes que contêm a palavra proibida, todos "
    f"certos. Mas quando a palavra está dentro de uma string ou de um comentário, o verificador erra "
    f"{CS['trap_errors']} de {CS['traps']} vezes.", step="restrições")
add("Depois do prazo, o professor revisa e comenta cada exercício", shot("revisao-professor.png"),
    "Depois do prazo, o professor revisa: nota automática pela fração de casos que passaram, e um comentário por "
    "exercício. Aqui, a saída estava certa mas violou a restrição de laço aninhado.", step="revisão")
add("As notas da turma inteira ficam numa tabela", shot("v4-gradebook.png"),
    "O boletim: cada aluno numa linha, cada exercício numa coluna, com a soma por aula e o total. Traço indica "
    "aula não entregue. As notas vêm do mesmo cálculo da revisão, então os dois nunca discordam.", step="notas")
add("O boletim vai para CSV sem quebrar acentos nem executar fórmulas", v4.b_csv,
    "O boletim exporta para CSV. Três cuidados: segue a RFC 4180 para aspas e quebras de linha; começa com um "
    "BOM para o Excel abrir os acentos certos; e neutraliza células que começam com igual, mais, menos ou "
    "arroba, para um nome de aluno malicioso não virar fórmula no Excel do professor.", step="notas")

# ---- 6 plágio
part(6)
steps("relatório", "algoritmo", "qualidade", "custo")
add("Com os envios da turma, o professor vê os pares mais parecidos", shot("v4-similarity-pairs.png"),
    "Com os envios de um torneio ou de uma aula, o professor pode pedir o relatório de similaridade: escolhe o "
    "problema, se compara o último envio ou o melhor de cada aluno, e a similaridade mínima. A tela avisa: nota "
    "alta é motivo para ler os dois códigos, não prova de cópia.", step="relatório")
add("Lado a lado, os trechos iguais aparecem destacados", shot("v4-similarity-side-by-side.png"),
    "Clicando no par, os dois códigos aparecem lado a lado, com os trechos coincidentes da mesma cor. Aqui a "
    "aluna renomeou tudo e adicionou comentários: cem por cento coincidente mesmo assim.", step="relatório")
add("A mesma comparação funciona em cada exercício das aulas", shot("v4-similarity-exercise.png"),
    "A mesma comparação existe para cada exercício de uma aula.", step="relatório")
add("Por trás, o código vira impressões digitais antes da comparação", v4.b_plag_pipeline,
    "O algoritmo é o do MOSS, de Schleimer, Wilkerson e Aiken. O código vira tokens, com um tokenizador por "
    "linguagem. Grupos de 5 tokens viram hashes, os k-gramas. O winnowing escolhe o menor hash de cada janela, e "
    "esses são as impressões digitais. Pares que compartilham impressões são comparados por greedy string "
    "tiling, que encontra os trechos iguais, e a similaridade é a fração de tokens cobertos.",
    step="algoritmo")
add("Renomear variáveis não engana a comparação", v4.b_normalize,
    "O truque está na normalização: identificadores viram V, números viram N, strings viram S, e comentários e "
    "espaços somem. Além disso, o código que a maioria da turma compartilha, como o esqueleto do problema, é "
    "descontado.", step="algoritmo")
add(f"Testado: cópias ofuscadas ficam acima de {fmt(PQ['best_f1_pair']['threshold'], 2)}; soluções independentes, "
    f"abaixo", chart("plagiarism_levels", "36 soluções originais, 6 ofuscações cada"),
    f"Para medir a qualidade, escrevi 36 soluções independentes: 4 problemas, em Python, C e Java, cada um com 3 "
    f"autores de estilos diferentes. Cada uma ganhou 6 cópias ofuscadas automaticamente: renomear, reformatar, "
    f"comentários, reordenar funções, inserir código morto e tudo junto. Tudo junto tem mediana de "
    f"{fmt(PQ['median_by_level_pair']['combined'] * 100, 0)}%; soluções independentes do mesmo problema, "
    f"{fmt(PQ['median_by_level_pair']['independent'] * 100, 0)}%.", step="qualidade")
add(f"Com o limiar de {fmt(PQ['best_f1_pair']['threshold'], 2)}: {fmt(PQ['best_f1_pair']['precision'] * 100, 0)}% "
    f"de precisão e {fmt(PQ['best_f1_pair']['recall'] * 100, 1)}% de revocação",
    chart("plagiarism_roc", f"{PQ['copies']} cópias contra "
                            f"{PQ['negatives_same_problem'] + PQ['negatives_other_problem']} pares independentes"),
    f"Na curva ROC, a área é {fmt(PQ['auc_pair_all_negatives'], 3)}. O melhor limiar foi "
    f"{fmt(PQ['best_f1_pair']['threshold'], 2)}. No relatório da turma, com o filtro de código comum, nenhuma "
    f"solução independente passou de {fmt(PQ['max_independent_class'] * 100, 0)}%. Cuidado: as ofuscações são "
    f"automáticas e sistemáticas, não as de um aluno esperto.", step="qualidade")
add("200 alunos comparados em menos de meio segundo",
    chart("plagiarism_perf", "Um exercício, uma linguagem, todos os pares"),
    f"O custo cresce com o quadrado do número de alunos, porque compara todos os pares. Mesmo assim: 30 alunos em "
    f"cerca de {fmt(PP['python']['30'], 0)} ms, 200 alunos em {fmt(PP['python']['200'], 0)} a "
    f"{fmt(PP['c']['200'], 0)} ms, 300, o máximo do relatório, em menos de um segundo. Duas limitações ficam "
    f"para a discussão: só compara a mesma linguagem e não detecta código gerado por IA.", step="custo")

# ---- 7 por dentro
part(7)
steps("arquitetura", "sandbox", "vereditos", "comparação")
add("Por trás de tudo isso, dois serviços que só conversam pelo banco", b_arch,
    "Tudo o que vimos roda sobre esta arquitetura. O navegador fala com o Next.js por Server Actions. A action "
    "grava o envio como PENDING e dispara um NOTIFY no PostgreSQL. O judge, em Rust, está escutando; pega o "
    "envio, compila e roda cada caso de teste no isolate, e grava o veredito no mesmo banco. Não há fila externa "
    "nem API entre os dois. A IA é chamada só pelo Next.js, por uma cadeia de três modelos.",
    step="arquitetura", max_words=16)
add("Um script garante que Rust e TypeScript concordam no banco", v4.b_enum_sync,
    "Como os dois serviços compartilham o banco, mas não o código, o status do envio e a linguagem são enums "
    "definidos duas vezes, em Rust e no Drizzle. Se um lado ganhar um valor e o outro não, o judge quebra ao ler "
    "a linha. O script check-enum-sync compara os dois e falha o CI.", step="arquitetura")
add("Todo código do aluno roda numa caixa sem rede", v4.b_isolate,
    "Cada execução roda numa caixa nova do isolate, o sandbox usado na Olimpíada Internacional de Informática. "
    "A caixa não tem rede, tem limite de tempo de CPU e de parede, de memória, e no máximo 64 processos, o que "
    "contém fork bombs. Depois de cada caso de teste a caixa é destruída. Não precisamos de Docker privilegiado, "
    "só de duas capabilities do Linux.", step="sandbox")
add("Seis linguagens, do C ao Portugol", v4.b_languages,
    "O judge roda seis linguagens: C, C++, Java, Python, Rust e Portugol. Linguagens compiladas compilam uma vez "
    "por envio, numa caixa própria, e o tempo de compilação não conta no limite do problema. Portugol é o caso "
    "especial: o interpretador recompila o programa em toda execução, por isso ganha mais tempo.",
    step="sandbox")
add("Cada falha tem nome: os seis vereditos", b_verdicts,
    "Até a versão 3, o judge só dizia passou ou falhou. Agora cada falha tem nome, no padrão das maratonas. "
    "Aceito: passou em todos os casos. Resposta errada: terminou, mas a saída é diferente. Tempo excedido: o "
    "limite do problema vezes um fator da linguagem; Java ganha o dobro mais meio segundo, Python o triplo. "
    "Memória excedida: 128 MB em C, C++ e Python. Erro de compilação: o aluno vê a saída do compilador. Erro de "
    "execução: divisão por zero, índice fora do vetor. O veredito do envio é o do primeiro caso que falhou; o "
    "erro do juiz, quando a falha é nossa, nunca penaliza o aluno.", step="vereditos", max_words=40)
add("Erro de compilação não penaliza no placar", v4.b_ce_penalty,
    "No placar, seguimos a convenção da ICPC: tentativas rejeitadas custam 20 minutos de penalidade quando o "
    "problema é resolvido, mas erro de compilação não conta. Quem não compilou não chegou a ser julgado.",
    step="vereditos")
add("Memória excedida é deduzida, não detectada", v4.b_mle,
    "Por que o MLE é difícil: o limite de memória do isolate, sem cgroups, é de espaço de endereçamento. Quando "
    "estoura, o malloc falha e o programa quebra; não há um sinal limpo de falta de memória. Então o judge deduz: "
    "se o pico chegou a 90% do limite, ou se a saída de erro tem MemoryError ou bad_alloc, é MLE.",
    step="vereditos")
add("A saída pode ser comparada de quatro jeitos", v4.b_compare_modes,
    "Comparar a saída é configurável por problema. Exata: idêntica, ignorando só espaços no começo e no fim. "
    "Tokens: palavra por palavra; é o padrão de problema novo. Float: números aceitos dentro de uma tolerância. "
    "E corretor: um programa do professor decide.", step="comparação")
add("Quando há várias respostas certas, um corretor decide",
    shot("v4-compare-checker.png", "Problema: imprima qualquer divisor de N"),
    "O corretor serve para problemas com mais de uma resposta certa. Neste exemplo, imprimir qualquer divisor de "
    "N: 12 aceita 2, 3, 4 ou 6. O professor escreve um pequeno programa que decide. O código do corretor nunca "
    "chega ao aluno.", step="comparação")
add("O corretor recebe três arquivos e responde pelo código de saída", v4.b_checker_protocol,
    "O protocolo é o do testlib: entrada, saída do aluno e resposta esperada. Código zero é aceito; um é resposta "
    "errada, e o que ele imprimir vira a mensagem para o aluno; qualquer outra coisa é erro do juiz, que não "
    "penaliza o aluno. O corretor roda no isolate como qualquer programa.", step="comparação")
add("Testado: ignorar espaços aceita respostas certas que a comparação exata recusava",
    chart("compare_modes", "Saídas certas reescritas de jeitos comuns"),
    f"Peguei as saídas esperadas dos dez problemas de exemplo e as reescrevi como um programa correto costuma "
    f"escrever: espaço no fim da linha, linhas em branco, quebra de linha do Windows, floats com outra precisão. "
    f"O modo tokens aceita todas as de espaço. Floats com outra precisão só passam no modo float: "
    f"{RG['synthetic']['synthetic:float-format']['float_1e-6']} de 12. No histórico real, as "
    f"{RG['historical_mismatches']} respostas erradas eram todas erros de verdade.", step="comparação")

# ---- 8 desempenho
part(8)
steps("concorrência", "latência", "custo", "vereditos", "IA", "site", "testes")
add("Todos os números vêm de benchmarks reproduzíveis", b_bench_setup,
    "Para a banca não ter que acreditar em mim, todos os números a seguir vêm de scripts no diretório bench do "
    "repositório, com os resultados brutos commitados. Máquina: Ryzen 5 5600, 32 GB de RAM, CachyOS. O judge roda "
    "na mesma imagem Docker de produção, contra um PostgreSQL descartável.", max_words=30)
add("Primeiro, o judge passou a julgar vários envios ao mesmo tempo", v4.b_concurrency_arch,
    "A primeira mudança de desempenho: o judge virou um pool de workers. Um dispatcher escuta o NOTIFY, faz a "
    "varredura a cada 60 segundos e reaproveita envios travados; os workers pegam envios com FOR UPDATE SKIP "
    "LOCKED, então dois nunca pegam o mesmo. Cada worker tem a sua caixa do isolate.", step="concorrência")
add(f"4 workers julgam {fmt(CC['burst100-n4']['speedup_vs_n1'])}× mais rápido; 8 workers, "
    f"{fmt(CC['burst100-n8']['speedup_vs_n1'])}×",
    chart("concurrency_throughput", "Rajada de envios nas 6 linguagens, 5 testes cada"),
    f"O benchmark simula uma turma apertando enviar ao mesmo tempo: 40 ou 100 envios de uma vez, misturando as "
    f"seis linguagens. Com um worker, 100 envios levam {fmt(c100['wall_s'], 0)} segundos. Com 4, "
    f"{fmt(CC['burst100-n4']['wall_s'], 0)}; com 8, {fmt(CC['burst100-n8']['wall_s'], 0)}. Não escala "
    f"linearmente porque compiladores e a JVM disputam CPU e disco.", step="concorrência")
add(f"Com 8 workers, metade da turma espera menos de {fmt(CC['burst100-n8']['latency_p50_s'], 0)} s, não "
    f"{fmt(c100['latency_p50_s'], 0)} s",
    chart("concurrency_latency", "Rajada de 100 envios: espera até o veredito"),
    f"O que o aluno sente é a espera. Com um worker a mediana é {fmt(c100['latency_p50_s'], 0)} segundos e o "
    f"percentil 95 é {fmt(c100['latency_p95_s'], 0)}. Com 8 workers, a mediana cai para "
    f"{fmt(CC['burst100-n8']['latency_p50_s'], 0)} segundos e o p95 para "
    f"{fmt(CC['burst100-n8']['latency_p95_s'], 0)}.", step="concorrência")
add("Em 1 CPU, mais workers não ajudam, e a produção roda assim",
    chart("concurrency_1cpu", "Mesma rajada de 40, com o contêiner preso a 1 CPU"),
    f"A parte honesta: em produção, o judge roda numa máquina da Fly.io com uma vCPU. Prendi o contêiner a uma "
    f"CPU e repeti: com 1 worker, {fmt(CC['burst40-n1-1cpu']['wall_s'], 0)} segundos; com 4, "
    f"{fmt(CC['burst40-n4-1cpu']['wall_s'], 0)}. Nenhum ganho. O pool só ajuda com vários núcleos.",
    step="concorrência")
add("Sem fila, o veredito sai em menos de 0,4 s, exceto Java e Portugol",
    chart("e2e_stages", "Um envio por vez, judge ocioso, 5 casos de teste"),
    f"Com o judge ocioso: do INSERT até o judge pegar a linha, cerca de {E2E['c']['queue_ms']} milissegundo. C "
    f"fica pronto em {ms(E2E['c']['total_ms'])}, Python em {ms(E2E['python']['total_ms'])}, Java em "
    f"{ms(E2E['java']['total_ms'])}. Portugol leva {ms(E2E['portugol']['total_ms'])}, porque o interpretador "
    f"recompila o programa em cada caso de teste.", step="latência")
add("Compilar custa mais que rodar, exceto no Portugol", chart("lang_time", "Mediana de 6 execuções no isolate"),
    f"C compila em {LC['c']['compile_ms']} ms, C++ em {LC['cpp']['compile_ms']}, Rust em "
    f"{LC['rust']['compile_ms']}, Java em {LC['java']['compile_ms']}. Rodar um olá mundo leva poucos "
    f"milissegundos, exceto Portugol: {fmt(LC['portugol']['run_hello_ms'] / 1000)} segundo.", step="custo")
add("Java e Portugol usam dezenas de vezes mais memória", chart("lang_memory", "Pico de memória no laço de 10⁷ passos"),
    f"C, C++ e Rust ficam abaixo de 4 MB, Python em {fmt(LC['python']['peak_mb_cpu'])} MB. Java usa "
    f"{fmt(LC['java']['peak_mb_cpu'], 0)} MB e Portugol {fmt(LC['portugol']['peak_mb_cpu'], 0)}, por causa da "
    f"JVM.", step="custo")
add(f"O isolate custa cerca de {fmt(SB['c_hello']['overhead_ms'], 0)} ms por execução",
    chart("sandbox_overhead", "Mesmo programa, com e sem caixa"),
    f"Quanto custa a segurança? O mesmo programa direto e dentro do isolate: {fmt(SB['c_hello']['overhead_ms'], 0)} "
    f"a {fmt(SB['java_hello']['overhead_ms'], 0)} ms a mais por execução na maioria das linguagens. Só criar e "
    f"destruir uma caixa vazia leva {fmt(SB['box_lifecycle_ms_median'])} ms.", step="custo")
add(f"O judge acertou {VD['correct']} de {VD['programs']} vereditos; os erros têm causa conhecida",
    chart("verdict_confusion", "2 programas por veredito × 6 linguagens"),
    "Escrevi dois programas para cada veredito em cada linguagem: 72 programas, julgados pelo código real. "
    "Aceito, resposta errada e tempo excedido: 100%. Três causas de erro: o console do Portugol imprime erros na "
    "saída padrão e termina com código zero, então vira resposta errada, 6 dos 9 erros; Python não tem etapa de "
    "compilação, então erro de sintaxe vira erro de execução; e o MLE é heurístico. Fora do Portugol, 57 de 60.",
    step="vereditos")
add(f"Cada ajuda da IA leva de {fmt(min(v['median'] for v in AI['latency_s'].values()), 0)} a "
    f"{fmt(max(v['median'] for v in AI['latency_s'].values()), 0)} s",
    chart("ai_latency", "10 chamadas por recurso (20 na solução de referência)"),
    f"Fiz 10 chamadas de cada recurso de IA com os prompts reais: {AI['calls_logical']} no total. As medianas "
    f"ficaram entre {fmt(min(v['median'] for v in AI['latency_s'].values()))} e "
    f"{fmt(max(v['median'] for v in AI['latency_s'].values()))} segundos, incluindo as tentativas que falharam "
    f"antes do fallback responder.", step="IA")
add("A IA passa por três modelos; o fallback salvou mais da metade das chamadas", b_ai_chain,
    f"Toda chamada de IA passa por um módulo do Next.js. Ele tenta o Gemini 3.5 Flash; se falhar ou passar de 30 "
    f"segundos, o Flash-Lite; e por último o Claude Haiku 5.5, quando a chave da Anthropic está configurada. "
    f"Durante o benchmark a chave do Gemini Flash estourou a cota: das {AI['calls_logical']} chamadas, "
    f"{AI['calls_with_fallback']} precisaram de fallback, e nenhuma ficou sem resposta.", step="IA")
add(f"Placar de 1000 alunos em {fmt(WC['standings@1000']['ms'] / 1000, 2)} s; boletim em "
    f"{fmt(WC['gradebook+csv@1000']['ms'] / 1000, 2)} s",
    chart("web_compute", "Cálculo puro, sem banco, dados sintéticos"),
    f"O placar e o boletim são calculados no servidor a cada visita. Com 1000 alunos: placar em "
    f"{fmt(WC['standings@1000']['ms'], 0)} ms, boletim com 240 exercícios em "
    f"{fmt(WC['gradebook+csv@1000']['ms'], 0)} ms. Numa turma de 30, abaixo de 2 ms.", step="site")
add(f"{TESTS['judge']['tests']} testes no judge, {TESTS['web']['tests']} no site",
    v4.b_big_numbers([(str(TESTS["judge"]["tests"]), "testes do judge", "accent1"),
                      (str(TESTS["web"]["tests"]), "testes do site", "accent5")]),
    f"Além dos benchmarks, testes automatizados: o judge tem {TESTS['judge']['tests']}, 20 deles rodando código de "
    f"verdade no isolate, incluindo fork bomb, laço infinito e estouro de memória. O site tem "
    f"{TESTS['web']['tests']} testes das funções puras: placar, boletim, plágio, pesquisa.", step="testes")
add("Cada push roda três jobs no GitHub Actions", b_ci,
    f"Cada push e pull request roda três jobs em paralelo: web, com tipos, lint e testes; judge, com formatação, "
    f"clippy e os testes que não precisam do sandbox; e o enum-sync. Mediana de "
    f"{fmt(CI['jobs']['web']['median_s'], 0)} segundos no web e {fmt(CI['jobs']['judge']['median_s'], 0)} no "
    f"judge.", step="testes", max_words=24)

# ---- 9 avaliação
part(9)
steps("convite", "SUS", "turma", "nota", "itens", "ajudou", "atrapalhou", "correções")
add("A avaliação acontece dentro do sistema, no fim da atividade", shot("v4-survey-banner.png"),
    "Como os alunos avaliaram. Os questionários estão dentro do próprio sistema: quando a lista ou o torneio "
    "termina, aparece este convite para quem participou. Começa pelo termo de consentimento, e as respostas são "
    "anônimas na análise.", step="convite")
add("A usabilidade é medida pelo SUS", shot("v4-survey-sus.png"),
    "A usabilidade é medida pela System Usability Scale, de Brooke: dez afirmações de 1 a 5, e o sistema calcula "
    "a nota de 0 a 100 automaticamente. Depois vêm perguntas específicas sobre a lista e duas perguntas abertas.",
    step="SUS")
add(f"{SV['responses']} alunos fizeram uma lista em sala, em 29/10/2026",
    v4.b_big_numbers([(str(SV["responses"]), "alunos responderam", "accent1"),
                      (str(SV["never_used_judge"]), "nunca usaram um juiz", "accent5"),
                      ("1", "lista, em Python", "accent4")],
                     "1º ano do Técnico em Informática integrado · IFMG"),
    f"O teste em sala foi em 29 de outubro, numa turma do primeiro ano do Técnico em Informática integrado do "
    f"IFMG. Os alunos resolveram uma lista de exercícios, a lista 12 extra 2, em Python, e responderam o "
    f"questionário do aluno logo depois. {SV['responses']} responderam; {SV['never_used_judge']} nunca tinham "
    f"usado um juiz online. Só alunos e só uma lista: não houve torneio nem questionário do professor nesse "
    f"teste.", step="turma", max_words=18)
add(f"SUS {fmt(SV['sus']['mean'])}: acima da referência de {SV['sus']['benchmark']}",
    chart("survey_sus_bands", f"Mediana {fmt(SV['sus']['median'])} · desvio {fmt(SV['sus']['sd'])} · "
                              f"IC 95%: {fmt(SV['sus']['ci95'][0])} a {fmt(SV['sus']['ci95'][1])}"),
    f"A nota SUS média foi {fmt(SV['sus']['mean'])}, acima da referência de {SV['sus']['benchmark']}: na escala "
    f"de Bangor, usabilidade boa. A mediana, {fmt(SV['sus']['median'])}, é maior que a média: 13 dos 30 deram "
    f"nota A, acima de 80,3, e um grupo menor de notas baixas puxa a média para baixo. A dispersão é grande: "
    f"desvio de {fmt(SV['sus']['sd'])}. Os itens mais fracos foram precisar de suporte técnico, 2,57, com 9 de 30 "
    f"concordando, e sentir-se confiante, 3,50; faz sentido numa turma em que 80% nunca tinha usado um juiz.",
    step="nota", max_words=16)
add("Entrar e entregar foi fácil; ganhar confiança, nem tanto",
    chart("survey_items", "Dicas da IA: 23 respostas; 7 alunos não usaram"),
    "Nas perguntas específicas, de 1 a 5: entrar na turma e achar a lista, 4,70; saber como entregar, 4,43; "
    "usaria para estudar sozinho, 4,13; as dicas da IA ajudaram sem dar a resposta, 4,04. O retorno do juiz "
    "ficou atrás, 3,53, e o ganho de confiança foi o mais baixo, 3,23.", step="itens")
add("O que mais ajudou: a IA e a correção imediata",
    b_quotes([("~14", "dicas da IA", "As dicas sem entregar a resposta da IA", "accent4"),
              ("~9", "correção imediata", "respostas e feedbacks quase imediatos", "accent1")]),
    "Na pergunta aberta sobre o que ajudou, as respostas se agrupam em dois temas. Cerca de 14 citaram a IA: "
    "dicas que não entregam a resposta, ajuda quase em tempo real. Cerca de 9 citaram a correção automática e "
    "imediata. Os sete comentários gerais foram todos positivos.", step="ajudou")
add("O que mais atrapalhou: a saída tinha que ser idêntica",
    b_quotes([("~9", "saída idêntica", "tive que refazer várias vezes", AMBER),
              ("~6", "erro do juiz pouco claro", "mostrar como ficou a minha saída", AMBER)]),
    "A reclamação principal: a saída tinha que bater exatamente com a esperada, espaço por espaço. No problema "
    "Matriz ao cubo, 26 envios de 13 alunos só diferiam em espaços. A segunda: o juiz não mostrava a saída do "
    "aluno nem o erro do Python.", step="atrapalhou", max_words=16)
add("Do retorno da turma às correções", b_fixes,
    "O que mudou depois do teste, já em produção: editor em tela cheia e com tamanho de fonte; o exercício "
    "mostra entrada, saída do aluno, saída esperada e o erro do Python nos casos visíveis; o painel da IA rola e "
    "pode ficar ao lado do código; o rascunho não se perde ao trocar o idioma; o veredito aparece na barra do "
    "editor; e o botão Executar roda o programa com uma entrada própria, sem contar como envio. A comparação "
    "exata ficou de fora: os problemas antigos continuam no modo exato, e passar para tokens é o próximo passo.",
    step="correções", max_words=60)

# ---- 10 discussão
part(10)
add("O que o sistema faz bem", v4.b_strengths,
    "Pontos fortes: não há fila externa, só o PostgreSQL; o isolamento é o da IOI, sem Docker privilegiado; e a "
    "IA está sob controle do professor.")
add("A maior limitação: uma turma, uma lista, só alunos",
    b_limit("30 alunos, uma aula, sem grupo de comparação. Torneio e professor ainda não foram avaliados."),
    "A maior limitação é o tamanho da avaliação: uma turma, uma lista, só Python, questionário logo após uma "
    "aula, sem grupo de comparação nem medida antes e depois. Também pode haver efeito de novidade. E só os "
    "alunos responderam: o torneio e a visão do professor ainda não foram avaliados.", max_words=20)
add("Limitações técnicas que os benchmarks mostraram", b_limits,
    "As limitações técnicas: em produção o judge tem uma vCPU, e aí o pool não ajuda. O console do Portugol "
    "imprime erros e termina com sucesso, então erro vira resposta errada. O MLE é heurístico; o modo cgroups do "
    "isolate resolveria. As restrições são busca no texto; um parser por linguagem resolveria. E o plágio só "
    "compara a mesma linguagem e não detecta código gerado por IA.", max_words=45)
add("Próximos passos", b_future,
    "Trabalhos futuros: avaliar o torneio e a visão do professor em sala; passar os problemas antigos da "
    "comparação exata para tokens, a maior reclamação dos alunos; detectar código gerado por IA; e ativar o modo "
    "cgroups do isolate.", max_words=16)
add("Onde estamos", b_cronograma,
    "Onde estamos: o teste em sala foi no dia 29, a análise e as correções vieram logo depois, e agora a defesa.", max_words=16)
reuse(13, "REFERÊNCIAS", v4.edit_references,
      "As referências, incluindo os quatro sistemas comparados, o artigo do winnowing de Schleimer, Wilkerson e "
      "Aiken, e o SUS de Brooke.")
add("", b_thanks, "Obrigado. Fico à disposição para perguntas.", kicker="")


# ------------------------------------------------------------------ build ----


def lint():
    problems = []
    for i, (kind, _, _, title, builder, notes, track, max_words) in enumerate(SLIDES, 1):
        if not notes or len(notes.split()) < 4:
            problems.append(f"slide {i}: missing notes")
        if title and len(title) > 95:
            problems.append(f"slide {i}: title over two lines ({len(title)} chars)")
        if kind == "new":
            s = S()
            builder(s)
            if max_words and s.words > max_words:
                problems.append(f"slide {i} ({title[:40]}): {s.words} body words")
            for o in s.overflow:
                problems.append(f"slide {i} FIT {o}")
    return problems


def lighten(xml):
    for dark, light in LIGHT_HEX.items():
        xml = xml.replace(f'srgbClr val="{dark}"', f'srgbClr val="{light}"')
    # v4 drew some arrows in the border color, which disappears on white
    xml = re.sub(r"<p:cxnSp>.*?</p:cxnSp>", lambda m: m.group(0).replace('val="accent6"', 'val="bg2"'), xml,
                 flags=re.S)
    return xml.replace('<a:alpha val="55000"/>', '<a:alpha val="18000"/>')


def build():
    for p in lint():
        print("LINT", p)
    tmp = Path(tempfile.mkdtemp())
    with zipfile.ZipFile(SRC) as z:
        z.extractall(tmp)
    ppt = tmp / "ppt"

    theme = ppt / "theme/theme1.xml"
    t = theme.read_text("utf-8")
    for slot, col in THEME.items():
        t = re.sub(rf"(<a:{slot}><a:srgbClr val=\")[0-9A-Fa-f]{{6}}", rf"\g<1>{col}", t, count=1)
    theme.write_text(t, "utf-8")
    for layout in (ppt / "slideLayouts").glob("slideLayout*.xml"):
        x = layout.read_text("utf-8").replace('srgbClr val="0B0F14"', f'srgbClr val="{BACKGROUND}"')
        layout.write_text(x, "utf-8")

    template = (ppt / "slides/slide14.xml").read_text("utf-8")
    sp = re.findall(r"<p:sp>.*?</p:sp>", template, re.S)
    head = template[:template.index(sp[2])]
    # narrower kicker box: the step tracker sits to its right
    head = head.replace('<a:off x="548640" y="347472"/><a:ext cx="8229600"',
                        '<a:off x="548640" y="347472"/><a:ext cx="4114800"', 1)
    tail = template[template.index(sp[-1]):]
    notes_tpl = (ppt / "notesSlides/notesSlide14.xml").read_text("utf-8")

    ct = (tmp / "[Content_Types].xml").read_text("utf-8")
    prels = (ppt / "_rels/presentation.xml.rels").read_text("utf-8")
    pres = (ppt / "presentation.xml").read_text("utf-8")
    v3_rid = {int(n): r for r, n in re.findall(r'Id="(rId\d+)"[^>]*Target="slides/slide(\d+)\.xml"', prels)}
    next_rid = max(int(r) for r in re.findall(r'Id="rId(\d+)"', prels)) + 1
    used = {n for kind, n, *_ in SLIDES if kind == "v3"}

    for n, rid in v3_rid.items():
        if n in used:
            continue
        prels = re.sub(rf'<Relationship Id="{rid}"[^>]*/>', "", prels)
        for part_ in (f"slides/slide{n}.xml", f"notesSlides/notesSlide{n}.xml"):
            ct = ct.replace(f'<Override PartName="/ppt/{part_}" ContentType="'
                            f'{CT_SLIDE if "slides/" == part_[:7] else CT_NOTES}"/>', "")
            (ppt / part_).unlink()
            rels = ppt / part_.replace("/", "/_rels/", 1).replace(".xml", ".xml.rels")
            rels.unlink(missing_ok=True)

    next_slide = 23
    sld_entries, sid = [], 256
    for kind, n, kicker, title, fn, notes, track, _ in SLIDES:
        if kind == "v3":
            f = ppt / f"slides/slide{n}.xml"
            x = f.read_text("utf-8")
            if kicker:
                x = set_kicker(x, kicker)
            if fn:
                x = fn(x)
            f.write_text(lighten(v4.widen_slide_number(x)), "utf-8")
            nf = ppt / f"notesSlides/notesSlide{n}.xml"
            nf.write_text(set_notes(nf.read_text("utf-8"), notes), "utf-8")
            rid = v3_rid[n]
        else:
            n = next_slide
            next_slide += 1
            s = S(20)
            if track:
                s.track(*track)
            fn(s)
            x = set_title(set_kicker(head, kicker), title) + "".join(s.xml) + tail
            x = v4.widen_slide_number(re.sub(r'<p:cSld name="[^"]*">', f'<p:cSld name="Slide {n}">', x))
            (ppt / f"slides/slide{n}.xml").write_text(lighten(x), "utf-8")
            rels = ['<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout2.xml"/>',
                    f'<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesSlide" Target="../notesSlides/notesSlide{n}.xml"/>']
            for rid_img, media, path in s.images:
                shutil.copy(path, ppt / "media" / media)
                rels.append(f'<Relationship Id="{rid_img}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/{media}"/>')
            (ppt / f"slides/_rels/slide{n}.xml.rels").write_text(
                '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                f'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">{"".join(rels)}</Relationships>',
                "utf-8")
            (ppt / f"notesSlides/notesSlide{n}.xml").write_text(set_notes(notes_tpl, notes), "utf-8")
            (ppt / f"notesSlides/_rels/notesSlide{n}.xml.rels").write_text(
                '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
                '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesMaster" Target="../notesMasters/notesMaster1.xml"/>'
                f'<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="../slides/slide{n}.xml"/>'
                '</Relationships>', "utf-8")
            ct = ct.replace("</Types>",
                            f'<Override PartName="/ppt/slides/slide{n}.xml" ContentType="{CT_SLIDE}"/>'
                            f'<Override PartName="/ppt/notesSlides/notesSlide{n}.xml" ContentType="{CT_NOTES}"/></Types>')
            rid = f"rId{next_rid}"
            next_rid += 1
            prels = prels.replace("</Relationships>",
                                  f'<Relationship Id="{rid}" Type="{NS_REL}/slide" Target="slides/slide{n}.xml"/></Relationships>')
        sld_entries.append(f'<p:sldId id="{sid}" r:id="{rid}"/>')
        sid += 1

    referenced = set()
    for rels in ppt.rglob("*.rels"):
        referenced |= set(re.findall(r'Target="\.\./media/([^"]+)"', rels.read_text("utf-8")))
    for m in (ppt / "media").iterdir():
        if m.name not in referenced:
            m.unlink()

    pres = re.sub(r"<p:sldIdLst>.*?</p:sldIdLst>", "<p:sldIdLst>" + "".join(sld_entries) + "</p:sldIdLst>", pres,
                  flags=re.S)
    (ppt / "presentation.xml").write_text(pres, "utf-8")
    (ppt / "_rels/presentation.xml.rels").write_text(prels, "utf-8")
    ct = re.sub(r'<Override PartName="(/[^"]+)"[^>]*/>',
                lambda m: m.group(0) if (tmp / m.group(1)[1:]).exists() else "", ct)
    (tmp / "[Content_Types].xml").write_text(ct, "utf-8")

    app = tmp / "docProps/app.xml"
    a = app.read_text("utf-8")
    count = len(SLIDES)
    a = re.sub(r"<Slides>\d+</Slides>", f"<Slides>{count}</Slides>", a)
    a = re.sub(r"<Notes>\d+</Notes>", f"<Notes>{count}</Notes>", a)
    a = re.sub(r"(<vt:lpstr>Slide Titles</vt:lpstr></vt:variant>\s*<vt:variant><vt:i4>)\d+", rf"\g<1>{count}", a)
    a = re.sub(r'<vt:vector size="\d+" baseType="lpstr">(.*?)</vt:vector>',
               lambda m: f'<vt:vector size="{3 + count}" baseType="lpstr">'
                         + "".join(re.findall(r"<vt:lpstr>(?:Arial|Calibri|Office Theme)</vt:lpstr>", m.group(1)))
                         + "".join(f"<vt:lpstr>Slide {i + 1}</vt:lpstr>" for i in range(count)) + "</vt:vector>",
               a, count=1, flags=re.S)
    app.write_text(a, "utf-8")

    OUT.unlink(missing_ok=True)
    with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as z:
        for p in sorted(tmp.rglob("*")):
            if p.is_file():
                z.write(p, p.relative_to(tmp).as_posix())
    shutil.rmtree(tmp)
    print(f"wrote {OUT.name} ({count} slides)")
    (HERE / "v5-slides.txt").write_text("".join(
        f"{i:3d}  {k or '—'}  |  {t or ('(v3 slide ' + str(n) + ')' if kind == 'v3' else '(sem título)')}\n"
        for i, (kind, n, k, t, *_) in enumerate(SLIDES, 1)), "utf-8")


if __name__ == "__main__":
    build()
