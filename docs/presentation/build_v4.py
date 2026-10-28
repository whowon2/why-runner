#!/usr/bin/env python3
"""Build the TCC II presentation deck v4 from v3.

    bench/.venv/bin/python docs/presentation/build_v4.py

Reads  "WhyRunner — Apresentação Parcial TCC II v3.pptx" (repo root, untouched)
Writes "WhyRunner — Apresentação TCC II v4.pptx"         (repo root)

v4 follows the advisor's feedback on v3 ("massante"): one idea per slide, the
title is the claim, one big screenshot or chart (docs/presentation/screenshots,
docs/presentation/charts), at most ~12 words of body text and 3 pills, and
everything else in the speaker notes. Only four v3 slides survive (title,
comparison table, iterations, references); the rest are generated here in
v3's own XML idiom. Benchmark numbers come from bench/results/summary.json.
See openspec/changes/presentation-v4-thesis-sync-benchmarks/ for the why.
"""

import importlib.util
import json
import re
import shutil
import tempfile
import zipfile
from pathlib import Path
from xml.sax.saxutils import escape

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
SRC = ROOT / "WhyRunner — Apresentação Parcial TCC II v3.pptx"
OUT = ROOT / "WhyRunner — Apresentação TCC II v4.pptx"
SHOTS = HERE / "screenshots"
CHARTS = HERE / "charts"
SUMMARY = json.loads((ROOT / "bench/results/summary.json").read_text())

_spec = importlib.util.spec_from_file_location("build_v3", HERE / "build_v3.py")
v3 = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(v3)
emu, remove_shapes, add_shapes = v3.emu, v3.remove_shapes, v3.add_shapes
set_kicker, set_title, replace_text, set_notes = v3.set_kicker, v3.set_title, v3.replace_text, v3.set_notes
NS_REL, CT_SLIDE, CT_NOTES = v3.NS_REL, v3.CT_SLIDE, v3.CT_NOTES

SLIDE_W = 13.333
TOP = 1.95          # below a two-line title
BOTTOM = 6.85       # above the footer
MAX_BODY_WORDS = 12

# Verdict badge colors, as in the app's StatusBadge.
VERDICT = {
    "AC": ("Aceito", "22C55E"), "WA": ("Resposta errada", "F0566A"), "TLE": ("Tempo excedido", "F5A524"),
    "MLE": ("Memória excedida", "C084FC"), "CE": ("Erro de compilação", "EAB308"), "RE": ("Erro de execução", "FB7185"),
}


def fmt(v, nd=1):
    return f"{v:.{nd}f}".replace(".", ",")


# ---------------------------------------------------------------- shapes ----


class S(v3.Shapes):
    """v3's shapes plus big images, pills, flows and a body-word counter."""

    def __init__(self, start_id=20):
        super().__init__(start_id)
        self.words = 0

    def text(self, x, y, w, h, paras, count=True, **kw):
        if count:
            flat = paras if isinstance(paras, str) else " ".join(
                p if isinstance(p, str) else " ".join(r if isinstance(r, str) else r[0] for r in p)
                for p in paras)
            self.words += len(re.findall(r"[\wÀ-ÿ]+", flat))
        super().text(x, y, w, h, paras, **kw)

    def image(self, path, x, y, w, h, frame=True, descr=""):
        fid = self._id()
        if frame:
            pad = 0.04
            self.xml.append(
                f'<p:sp><p:nvSpPr><p:cNvPr id="{fid}" name="frame-{path.name}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>'
                f'<p:spPr>{self._xfrm(x - pad, y - pad, w + 2 * pad, h + 2 * pad)}'
                f'<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>'
                f'<a:solidFill><a:schemeClr val="accent6"/></a:solidFill>'
                f'<a:ln w="9525"><a:solidFill><a:schemeClr val="accent6"/></a:solidFill></a:ln>'
                f'<a:effectLst><a:outerShdw blurRad="152400" dist="50800" dir="5400000" algn="bl" rotWithShape="0">'
                f'<a:srgbClr val="000000"><a:alpha val="55000"/></a:srgbClr></a:outerShdw></a:effectLst>'
                f'</p:spPr></p:sp>')
        rid = f"rId{10 + len(self.images)}"
        media = f"v4-{path.parent.name}-{path.name}"
        self.images.append((rid, media, path))
        pid = self._id()
        self.xml.append(
            f'<p:pic><p:nvPicPr><p:cNvPr id="{pid}" name="img-{path.name}" descr="{escape(descr or path.name)}"/>'
            f'<p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr>'
            f'<p:blipFill><a:blip r:embed="{rid}"/><a:stretch><a:fillRect/></a:stretch></p:blipFill>'
            f'<p:spPr>{self._xfrm(x, y, w, h)}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>')

    def fit(self, path, x0=0.6, y0=TOP, w0=SLIDE_W - 1.2, h0=BOTTOM - TOP, frame=True):
        from PIL import Image
        iw, ih = Image.open(path).size
        w = min(w0, h0 * iw / ih)
        h = w * ih / iw
        x = x0 + (w0 - w) / 2
        y = y0 + (h0 - h) / 2
        self.image(path, x, y, w, h, frame=frame)
        return x, y, w, h

    def caption(self, text, y=6.45):
        self.text(0.6, y, SLIDE_W - 1.2, 0.4, text, size=16, color="bg2", align="ctr", anchor="ctr")

    def pills(self, labels, y, colors=None, size=16, h=0.55):
        widths = [0.5 + 0.13 * len(lab) * size / 16 for lab in labels]
        gap = 0.35
        x = (SLIDE_W - sum(widths) - gap * (len(labels) - 1)) / 2
        for i, (lab, w) in enumerate(zip(labels, widths)):
            col = (colors or ["accent1"] * len(labels))[i]
            self.box(x, y, w, h, fill="tx2", line=col, adj=50000)
            self.text(x, y, w, h, lab, size=size, color=col, bold=True, mono=True, align="ctr", anchor="ctr")
            x += w + gap

    def card(self, x, y, w, h, label, sub=None, color="bg1", line="accent6", size=18, dash=None, fill="151B23",
             count=False, sub_size=12):
        self.box(x, y, w, h, fill=fill, line=line, dash=dash)
        if sub:
            self.text(x + 0.1, y + h / 2 - 0.42, w - 0.2, 0.42, label, size=size, color=color, bold=True,
                      align="ctr", anchor="b", count=count)
            self.text(x + 0.1, y + h / 2 + 0.05, w - 0.2, h / 2 - 0.1, sub, size=sub_size, color="bg2",
                      align="ctr", anchor="t", count=False)
        else:
            self.text(x + 0.1, y, w - 0.2, h, label, size=size, color=color, bold=True, align="ctr", anchor="ctr",
                      count=count)

    def flow(self, items, y, h=1.1, gap=0.55, x0=0.6, x1=SLIDE_W - 0.6, color="accent1", size=17, labels=None):
        """items: [(label, sub, line color, dash)] left to right with arrows."""
        n = len(items)
        w = (x1 - x0 - gap * (n - 1)) / n
        for i, it in enumerate(items):
            label, sub = it[0], it[1]
            line = it[2] if len(it) > 2 and it[2] else "accent6"
            dash = it[3] if len(it) > 3 else None
            x = x0 + i * (w + gap)
            self.card(x, y, w, h, label, sub, line=line, dash=dash, size=size)
            if i < n - 1:
                self.arrow(x + w + 0.06, y + h / 2, x + w + gap - 0.06, y + h / 2, color=color)
                if labels and labels[i]:
                    self.text(x + w - 0.2, y + h / 2 - 0.36, gap + 0.4, 0.28, labels[i], size=10, color="bg2",
                              align="ctr", mono=True, count=False)
        return w

    def badge_big(self, x, y, code, d=1.5, size=30):
        name, col = VERDICT[code]
        self.box(x, y, d * 1.6, d, fill="151B23", line=col, adj=12000)
        self.text(x, y, d * 1.6, d, code, size=size, color=col, bold=True, mono=True, align="ctr", anchor="ctr",
                  count=False)

    def statement(self, text, y=2.6, h=1.6, size=40, color="bg1", sub=None):
        self.text(0.8, y, SLIDE_W - 1.6, h, text, size=size, color=color, bold=True, align="ctr", anchor="ctr")
        if sub:
            self.text(0.8, y + h + 0.1, SLIDE_W - 1.6, 0.6, sub, size=18, color="bg2", align="ctr")


def shot(file, caption=None, frame=True):
    def build(s):
        path = (SHOTS / file) if (SHOTS / file).exists() else CHARTS / file
        s.fit(path, h0=(6.3 if caption else BOTTOM) - TOP, frame=frame and path.parent == SHOTS)
        if caption:
            s.caption(caption)
    return build


def chart(name, caption=None):
    return shot(f"{name}.png", caption, frame=False)


# ------------------------------------------------------------- builders ----

Q = SUMMARY
CC = Q["concurrency"]
LC = Q["lang_cost_median"]
E2E = Q["e2e_ms_median"]
PQ = Q["plagiarism_quality"]
PP = Q["plagiarism_perf_ms_median"]
VD = Q["verdicts"]
CS = Q["constraints"]
AI = Q["ai"]
AIR = Q["ai_reference"]
WC = Q["web_compute_ms_median"]
CI = Q["ci"]
RG = Q["regrade"]
SB = Q["sandbox"]
TESTS = Q["tests"]


def b_wrong_answer(s):
    s.box(2.9, 2.2, 7.5, 2.6, fill="151B23", line="accent3", adj=6000)
    s.text(2.9, 2.45, 7.5, 1.2, "✗  Wrong Answer", size=48, color="accent3", bold=True, mono=True, align="ctr",
           anchor="ctr")
    s.text(2.9, 3.75, 7.5, 0.6, "caso de teste 3 de 10 · sem explicação", size=18, color="bg2", align="ctr",
           mono=True)


def b_question(s):
    s.box(1.4, 2.0, 10.5, 3.4, fill="151B23", line="accent1", adj=5000)
    s.text(1.4, 2.15, 10.5, 0.5, "PERGUNTA DE PESQUISA", size=14, color="accent1", bold=True, mono=True,
           align="ctr", count=False)
    s.text(1.9, 2.7, 9.5, 2.4, "Feedback por IA e atividades curadas tornam o juiz útil para ensinar?",
           size=30, bold=True, align="ctr", anchor="ctr")


def b_goal(s):
    s.pills(["executa com segurança", "explica o erro", "professor no controle"], 3.4, size=20, h=0.75)


def b_unique(s):
    s.pills(["dicas por IA", "aulas do professor", "Portugol com blocos"], 3.6, size=20, h=0.7)


def b_arch(s):
    s.flow([("Navegador", "React · TanStack Query"), ("Next.js", "Server Actions"),
            ("PostgreSQL", "LISTEN / NOTIFY", "accent5"), ("Judge", "Rust · tokio · sqlx"),
            ("isolate", "sem rede · limites", "accent1")], 3.0, h=1.3)
    s.caption("O site grava; o judge escuta, executa e grava o veredito.", y=5.2)


def b_ai_chain(s):
    s.flow([("Gemini 3.5 Flash", "principal", "accent4"), ("Flash-Lite", "fallback 1", "accent4"),
            ("Claude Haiku 5.5", "se ANTHROPIC_API_KEY", "accent4", "dash")], 2.8, h=1.4, x0=1.2, x1=12.1,
           color="accent4", labels=["falhou", "falhou"])
    s.caption("30 s por tentativa · só o Next.js chama a IA", y=5.0)


def b_isolate(s):
    s.box(3.9, 2.0, 5.5, 3.0, fill="151B23", line="accent1", adj=4000, dash="dash")
    s.text(3.9, 2.15, 5.5, 0.4, "caixa do isolate", size=14, color="accent1", mono=True, align="ctr", count=False)
    s.text(3.9, 2.8, 5.5, 1.4, "programa do aluno", size=28, bold=True, align="ctr", anchor="ctr")
    s.pills(["sem rede", "tempo e memória", "≤ 64 processos"], 5.5)


def b_languages(s):
    langs = ["C", "C++", "Java", "Python", "Rust", "Portugol"]
    w, gap = 1.75, 0.25
    x = (SLIDE_W - 6 * w - 5 * gap) / 2
    for i, lang in enumerate(langs):
        s.card(x + i * (w + gap), 3.0, w, 1.2, lang, size=22, color="accent1" if lang == "Portugol" else "bg1",
               count=True)


def b_verdicts_all(s):
    codes = list(VERDICT)
    w = 1.75
    gap = 0.3
    x = (SLIDE_W - 6 * w - 5 * gap) / 2
    for i, c in enumerate(codes):
        name, col = VERDICT[c]
        s.box(x + i * (w + gap), 2.7, w, 1.1, fill="151B23", line=col, adj=12000)
        s.text(x + i * (w + gap), 2.7, w, 1.1, c, size=30, color=col, bold=True, mono=True, align="ctr",
               anchor="ctr", count=False)
        s.text(x + i * (w + gap) - 0.1, 3.95, w + 0.2, 0.6, name, size=13, color="bg2", align="ctr", count=False)
    s.caption("Antes: só “passou” ou “falhou”.", y=5.3)


def verdict_slide(code, line, example):
    def build(s):
        s.badge_big(5.45, 2.0, code, d=1.5, size=40)
        s.text(1.0, 3.8, SLIDE_W - 2.0, 0.7, line, size=24, bold=True, align="ctr", anchor="ctr")
        s.text(1.0, 4.7, SLIDE_W - 2.0, 0.6, example, size=16, color="bg2", align="ctr", mono=True, count=False)
    return build


def b_ce_penalty(s):
    s.card(2.0, 2.4, 4.2, 2.0, "WA, TLE, RE…", "+20 min por tentativa", line="accent3", size=24, sub_size=16)
    s.card(7.1, 2.4, 4.2, 2.0, "CE", "não conta no placar", line="accent1", size=28, sub_size=16)
    s.caption("Convenção da ICPC: quem não compilou não foi julgado.", y=5.1)


def b_mle(s):
    s.flow([("malloc falha", "limite RLIMIT_AS"), ("programa quebra", "sem sinal de OOM"),
            ("heurística", "pico ≥ 90% ou “MemoryError”"), ("MLE", None, "C084FC")], 2.8, h=1.4, size=18)
    s.caption("Não há sinal limpo de estouro: o judge deduz.", y=5.0)


def b_compare_modes(s):
    modes = [("exata", "“3 4” ≠ “3  4”"), ("tokens", "espaços não importam"), ("float (ε)", "3,1416 ≈ 3,14159"),
             ("corretor", "programa do professor")]
    w, gap = 2.75, 0.3
    x = (SLIDE_W - 4 * w - 3 * gap) / 2
    for i, (m, sub) in enumerate(modes):
        s.card(x + i * (w + gap), 2.6, w, 1.8, m, sub, line="accent1" if m == "tokens" else "accent6", size=24,
               sub_size=14)
    s.caption("Problema novo começa em “tokens”.", y=5.0)


def b_checker_protocol(s):
    for i, f in enumerate(["input.txt", "output.txt", "answer.txt"]):
        s.card(0.8, 2.0 + i * 1.05, 2.6, 0.8, f, size=16, color="accent5")
        s.arrow(3.45, 2.4 + i * 1.05, 4.6, 3.45, color="accent6")
    s.card(4.7, 2.85, 3.0, 1.2, "corretor", "programa do professor", line="accent1", size=22)
    outs = [("exit 0", "Aceito", "22C55E"), ("exit 1", "Resposta errada", "F0566A"), ("outro", "Erro do juiz", "8B96A3")]
    for i, (code, name, col) in enumerate(outs):
        s.arrow(7.75, 3.45, 9.0, 2.4 + i * 1.05, color="accent6")
        s.card(9.1, 2.0 + i * 1.05, 3.4, 0.8, f"{code} → {name}", size=15, color=col, line=col)
    s.caption("Roda no isolate, como o código do aluno.", y=5.6)


def b_concurrency_arch(s):
    s.card(0.7, 2.6, 2.6, 1.8, "PostgreSQL", "fila = tabela", line="accent5", size=20)
    s.card(4.2, 2.3, 3.4, 2.4, "dispatcher", "LISTEN/NOTIFY\nvarredura 60 s\nreaper", line="accent4", size=20)
    s.arrow(3.35, 3.5, 4.15, 3.5, color="accent5")
    for i in range(4):
        y = 1.85 + i * 0.95
        s.card(8.7, y, 3.9, 0.75, f"worker {i + 1} · caixa {i}", size=15)
        s.arrow(7.65, 3.5, 8.65, y + 0.37, color="accent4")
    s.text(8.7, 5.75, 3.9, 0.35, "FOR UPDATE SKIP LOCKED", size=12, color="accent5", mono=True, align="ctr",
           count=False)
    s.caption("N = JUDGE_CONCURRENCY (padrão: nº de CPUs, máx. 4)", y=6.25)


def b_big_numbers(pairs, caption=None):
    def build(s):
        n = len(pairs)
        w = 3.6
        gap = 0.8
        x = (SLIDE_W - n * w - (n - 1) * gap) / 2
        for i, (num, lab, col) in enumerate(pairs):
            s.text(x + i * (w + gap), 2.2, w, 1.6, num, size=72, color=col, bold=True, align="ctr", anchor="ctr",
                   count=False)
            s.text(x + i * (w + gap), 3.9, w, 0.6, lab, size=20, color="bg2", align="ctr")
        if caption:
            s.caption(caption, y=5.4)
    return build


def b_ci(s):
    s.card(4.9, 1.9, 3.5, 0.9, "push / pull request", size=18, line="accent5")
    jobs = [("web", "tipos · lint · testes"), ("judge", "fmt · clippy · testes"), ("enum-sync", "Rust ⇄ Drizzle")]
    for i, (j, sub) in enumerate(jobs):
        x = 1.2 + i * 3.8
        s.arrow(6.65, 2.85, x + 1.5, 3.55, color="accent6")
        s.card(x, 3.6, 3.0, 1.4, j, sub, line="accent1", size=22)
    s.caption("Os três rodam em paralelo.", y=5.6)


def b_enum_sync(s):
    s.card(0.9, 2.6, 3.8, 1.6, "judge/src/models.rs", "enum SubmissionStatus", line="accent2", size=16)
    s.card(8.6, 2.6, 3.8, 1.6, "web/drizzle/schemas", "pgEnum submission_status", line="accent5", size=16)
    s.card(5.15, 2.75, 3.0, 1.3, "check-enum-sync.ts", "falha se divergirem", line="accent1", size=15)
    s.arrow(4.75, 3.4, 5.1, 3.4, color="accent6")
    s.arrow(8.55, 3.4, 8.2, 3.4, color="accent6")
    s.caption("Os dois serviços dividem o banco, não o código.", y=5.0)


def b_fallback(s):
    m = AI["answered_by_model"]
    s.flow([(str(m.get("gemini-3.5-flash", 0)), "Gemini Flash", "accent4"),
            (str(m.get("gemini-3.5-flash-lite", 0)), "Flash-Lite", "accent4"),
            (str(m.get("claude-haiku-5-5", 0)), "Claude Haiku", "accent4", "dash")], 2.6, h=1.8, x0=1.6, x1=11.7,
           size=44, color="accent4", labels=["falhou", "falhou"])
    s.caption(f"{AI['calls_logical']} chamadas · {AI['failed_calls']} sem resposta", y=4.9)


def b_ai_levels(s):
    s.flow([("desligada", "sem IA"), ("conceito", "nomeia a área"), ("dica", "explica o erro"),
            ("precisa", "aponta a linha", "accent1")], 2.8, h=1.4, size=20)
    s.caption("O aluno libera um nível por vez.", y=5.0)


def b_legend(s):
    s.box(2.0, 2.3, 2.2, 1.6, fill="16A34A", line="16A34A", adj=8000)
    s.text(2.0, 2.3, 2.2, 1.6, ["2", [("22'", {"size": 20})]], size=40, color="FFFFFF", bold=True, align="ctr",
           anchor="ctr", count=False)
    s.text(3.95, 2.1, 0.5, 0.5, "★", size=30, color="F5A524", count=False)
    s.text(4.9, 2.3, 7.4, 1.6, [[("2", {"bold": True, "color": "accent1"}), " tentativas"],
                                [("22'", {"bold": True, "color": "accent1"}), " minuto do acerto"],
                                [("★", {"bold": True, "color": "F5A524"}), " primeiro a resolver"]],
           size=22, anchor="ctr")


def b_csv(s):
    s.text(1.0, 2.3, 11.3, 0.8, [[("=HYPERLINK(\"http://…\")", {"color": "accent3"}), "   →   ",
                                  ("'=HYPERLINK(\"http://…\")", {"color": "accent1"})]],
           size=24, mono=True, align="ctr", anchor="ctr", count=False)
    s.pills(["RFC 4180", "BOM para o Excel", "fórmulas neutralizadas"], 3.9)


def b_plag_pipeline(s):
    s.flow([("código", "do aluno"), ("tokens", "nomes → V"), ("k-gramas", "k = 5"), ("winnowing", "janela w = 4"),
            ("impressões", "hashes", "accent1")], 2.2, h=1.3, size=18, gap=0.45)
    s.flow([("pares", "mesma linguagem"), ("greedy tiling", "trechos iguais"), ("similaridade", "0 a 100%", "accent1")],
           4.2, h=1.3, size=18, x0=2.2, x1=11.1)
    s.caption("Estilo MOSS (Schleimer et al., 2003)", y=6.0)


def b_normalize(s):
    s.text(1.0, 2.2, 11.3, 0.8, "for (int i = 0; i < n; i++) total += v[i];", size=24, mono=True, align="ctr",
           anchor="ctr", color="bg1", count=False)
    s.arrow(6.65, 3.1, 6.65, 3.7, color="accent1")
    s.text(1.0, 3.8, 11.3, 0.8, "for ( int V = N ; V < V ; V ++ ) V += V [ V ] ;", size=24, mono=True,
           align="ctr", anchor="ctr", color="accent1", count=False)
    s.caption("Renomear e reformatar não muda o que é comparado.", y=5.2)


def b_pilot_intro(s):
    s.pills(["INFORMAL"], 1.95, colors=["accent2"])
    s.statement("5 colegas · Discord · sem roteiro", y=2.8, size=36)


def b_pilot_changes(s):
    rows = [("código oculto", "código visível"), ("medalhas", "placar ICPC"), ("JSON opaco", "erro com campo")]
    for i, (a, b) in enumerate(rows):
        y = 2.1 + i * 1.25
        s.box(1.5, y, 10.3, 1.0)
        s.text(1.8, y, 4.6, 1.0, a, size=20, color="bg2", anchor="ctr")
        s.arrow(6.5, y + 0.5, 7.3, y + 0.5, color="accent1")
        s.text(7.5, y, 4.2, 1.0, b, size=20, color="accent1", bold=True, anchor="ctr")


def b_pilot_liked(s):
    s.pills(["tema escuro, estilo terminal", "o nome: “Why” = “Uai”"], 3.2, size=20, h=0.75)


def b_date(s):
    s.text(0.6, 2.0, SLIDE_W - 1.2, 2.0, "29/10/2026", size=96, color="accent1", bold=True, mono=True, align="ctr",
           anchor="ctr", count=False)
    s.pills(["torneio", "lista de exercícios", "questionários + SUS"], 4.5)


def b_limit(text):
    def build(s):
        s.box(5.9, 2.0, 1.5, 1.5, fill="F5A524", line="F5A524", geom="ellipse")
        s.text(5.9, 2.0, 1.5, 1.5, "!", size=60, color="0B0F14", bold=True, align="ctr", anchor="ctr", count=False)
        s.text(1.0, 3.9, SLIDE_W - 2.0, 1.0, text, size=24, align="ctr", anchor="ctr")
    return build


def b_strengths(s):
    s.pills(["sem fila externa", "isolate da IOI", "IA sob controle do professor"], 3.4, size=18, h=0.7)


def b_cronograma(s):
    steps = [("1", "Teste em sala", "29/10"), ("2", "Análise", ""), ("3", "Defesa", "")]
    xs = [2.0, 5.95, 9.9]
    for i, ((n, a, b), x) in enumerate(zip(steps, xs)):
        s.badge(x + 0.45, 2.4, n, color="accent1" if i == 0 else "accent6", d=0.9, size=24)
        s.text(x - 0.6, 3.5, 2.9, 0.5, a, size=22, bold=True, align="ctr")
        if b:
            s.text(x - 0.6, 4.05, 2.9, 0.4, b, size=16, color="bg2", align="ctr")
        if i < 2:
            s.arrow(x + 1.45, 2.85, xs[i + 1] + 0.35, 2.85, color="accent6")


def b_future(s):
    s.pills(["detectar código de IA", "isolate com cgroups", "judge multi-core"], 3.4, size=18, h=0.7)


def b_section(title, sub=None):
    def build(s):
        s.statement(title, y=2.4, size=48, color="accent1", sub=sub)
    return build


def b_thanks(s):
    s.statement("Obrigado!", y=2.2, size=60, color="accent1", sub="Perguntas?")


# ---------------------------------------------------------------- notes ----

c40, c100 = CC["burst40-n1"], CC["burst100-n1"]


def ms(v):
    return f"{v:.0f} ms" if v < 1000 else f"{fmt(v / 1000)} s"


SLIDES = []  # (kind, ref, kicker, title, builder/editor, notes)
SECTION = [""]


def section(name):
    SECTION[0] = name


def add(title, builder, notes, kicker=None):
    SLIDES.append(("new", None, kicker or SECTION[0], title, builder, notes))


def reuse(n, kicker, editor, notes):
    SLIDES.append(("v3", n, kicker, None, editor, notes))


def edit_title_slide(x):
    x = replace_text(x, "whyrunner --tcc-ii --parcial", "whyrunner --tcc-ii --v4")
    return replace_text(x, "TCC II · Apresentação parcial · 16/10/2026", "TCC II · Apresentação · outubro de 2026")


def widen_slide_number(x):
    """v3's slide-number box fits two digits; v4 has three."""
    return x.replace('<a:off x="11274552" y="6419088"/><a:ext cx="365760" cy="228600"/>',
                     '<a:off x="10909300" y="6419088"/><a:ext cx="731520" cy="228600"/>')


def edit_references(x):
    para = re.search(r'<a:p><a:pPr[^>]*><a:spcAft>(?:(?!</a:p>).)*?<a:t>SILVA, J\. T\. S\.', x, re.S)
    start = para.start()
    end = x.index("</a:p>", start) + len("</a:p>")
    entry = re.sub(r"<a:t>[^<]*</a:t>",
                   "<a:t>SCHLEIMER, S.; WILKERSON, D. S.; AIKEN, A. Winnowing: local algorithms for document "
                   "fingerprinting. ACM SIGMOD, 2003.</a:t>", x[start:end], count=1)
    return x[:start] + entry + x[start:]


# ---- abertura
reuse(1, None, edit_title_slide,
      "Boa tarde. Eu sou o Juan, e este é o WhyRunner: um juiz online para o ensino de programação, com dicas de "
      "IA que o professor controla. Esta versão da apresentação tem uma ideia por slide; os detalhes estão aqui "
      "nas notas.")
section("01 · INTRODUÇÃO")
add("Juízes online corrigem código; ensinar é outra coisa", b_wrong_answer,
    "Um juiz online recebe o código, roda contra casos de teste e devolve um veredito. Em sistemas como o BOCA ou "
    "o Run Codes, o aluno vê só isto: Wrong Answer, caso 3 de 10, sem explicação. Para quem está aprendendo, "
    "isso não ensina nada. Foi a minha experiência em maratonas de programação usando esses sistemas como aluno.")
add("Feedback e atividades curadas tornam o juiz útil para ensinar?", b_question,
    "Daí a pergunta de pesquisa: será que feedback gerado por IA, somado a atividades montadas pelo professor, "
    "torna um juiz online mais útil para o ensino? O resto da apresentação mostra o que foi construído para "
    "responder isso, e como vamos testar.")
add("O objetivo é um juiz online feito para a sala de aula", b_goal,
    "O objetivo geral é desenvolver e avaliar um juiz online voltado ao ensino. Três pilares: executar código com "
    "segurança em várias linguagens; explicar o erro, com dicas de IA que não entregam a solução; e deixar o "
    "professor no controle, montando aulas, torneios e decidindo quanto a IA ajuda.")
reuse(4, "01 · INTRODUÇÃO · TRABALHOS RELACIONADOS", None,
      "Analisei quatro sistemas: Ataux, de 2021; o Gamma Online Judge, da UnB, de 2022; o Run Codes; e o BOCA, de "
      "2004, usado na Maratona da SBC. Nenhum deles dá feedback explicativo: todos corrigem, nenhum ensina. Alguns "
      "têm placar em tempo real, mas nenhum deixa o professor montar uma aula ou exigir um algoritmo.")
add("Três coisas que nenhum dos sistemas analisados tem", b_unique,
    "Resumindo a tabela: o diferencial está em três colunas. Dicas por IA, sob controle do professor. Aulas "
    "montadas pelo professor, com prazo e revisão. E Portugol com blocos, para quem nunca programou: o aluno "
    "encaixa blocos em português e eles viram código que roda no judge.")

# ---- metodologia
section("02 · METODOLOGIA")
reuse(5, "02 · METODOLOGIA · ETAPAS", None,
      "O desenvolvimento foi iterativo. A fila começou com BullMQ e depois AWS SQS, e terminou no próprio "
      "PostgreSQL com LISTEN e NOTIFY. O backend NestJS separado virou Server Actions do Next.js. O Supabase virou "
      "PostgreSQL com Drizzle. E a execução em contêiner Docker por submissão virou o isolate, o sandbox da IOI.")
add("Dois serviços que só conversam pelo banco", b_arch,
    "A arquitetura: o navegador fala com o Next.js por Server Actions. A action grava a submissão como PENDING e "
    "dispara um NOTIFY no PostgreSQL. O judge, em Rust, está escutando; pega a submissão, compila e roda cada caso "
    "de teste no isolate, e grava o veredito no mesmo banco. Não há fila externa nem API entre os dois.")
add("A IA passa por uma cadeia de três modelos", b_ai_chain,
    "Toda chamada de IA passa por um único módulo do Next.js, nunca pelo judge. Ele tenta primeiro o Gemini 3.5 "
    "Flash; se falhar ou passar de 30 segundos, o Gemini 3.5 Flash-Lite; e por último o Claude Haiku 5.5, quando "
    "a chave da Anthropic está configurada. Só falhas transitórias passam adiante: timeout, rede, 429, 5xx ou "
    "saída que não valida no schema.")

# ---- judge
section("03 · O JUDGE")
add("O judge executa e corrige; o site só pede", b_section("O judge", "execução, veredictos e comparação"),
    "Agora o judge: como ele executa o código, que vereditos devolve e como compara a saída.")
add("Todo código roda numa caixa sem rede", b_isolate,
    "Cada execução roda numa caixa nova do isolate, o sandbox usado na Olimpíada Internacional de Informática. "
    "A caixa não tem rede, tem limite de tempo de CPU e de parede, de memória, e no máximo 64 processos, o que "
    "contém fork bombs. Depois de cada caso de teste a caixa é destruída. Não precisamos mais de Docker "
    "privilegiado, só de duas capabilities do Linux.")
add("Seis linguagens, do C ao Portugol", b_languages,
    "O judge roda seis linguagens: C, C++, Java, Python, Rust e Portugol. Todos os compiladores estão na mesma "
    "imagem. Linguagens compiladas compilam uma vez por submissão, numa caixa própria, e o tempo de compilação "
    "não conta no limite do problema. Portugol é o caso especial: o interpretador recompila o programa em toda "
    "execução, por isso ganha mais tempo.")
add("Cada falha agora tem nome: seis veredictos", b_verdicts_all,
    "Até a versão 3, o judge só dizia passou ou falhou. Agora cada falha tem nome, no padrão das maratonas: "
    "aceito, resposta errada, tempo excedido, memória excedida, erro de compilação e erro de execução. O veredito "
    "da submissão é o do primeiro caso que falhou. Há ainda o erro do juiz, quando a falha é nossa, que nunca "
    "penaliza o aluno.")
add("Aceito: passou em todos os casos de teste", verdict_slide("AC", "Passou em todos os casos de teste", "veredito: PASSED"),
    "Aceito é o óbvio: o programa produziu a saída esperada em todos os casos de teste, dentro dos limites.")
add("Resposta errada: a saída não bate com a esperada", verdict_slide("WA", "A saída não bate com a esperada", "esperado 15 · recebido 14"),
    "Resposta errada: o programa terminou normalmente, mas a saída é diferente da esperada, segundo o modo de "
    "comparação do problema. É o erro de lógica clássico.")
add("Tempo excedido: o programa não terminou a tempo", verdict_slide("TLE", "Não terminou dentro do limite", "limite do problema × fator da linguagem"),
    "Tempo excedido: estourou o limite de CPU ou de tempo de parede. O limite é o do problema multiplicado por um "
    "fator da linguagem: Java ganha o dobro mais meio segundo pela JVM, Python o triplo, Portugol o dobro mais "
    "três segundos.")
add("Memória excedida: o programa pediu memória demais", verdict_slide("MLE", "Pediu mais memória que o limite", "128 MB em C, C++ e Python"),
    "Memória excedida: o programa tentou usar mais memória do que o limite da caixa. É o veredito mais difícil de "
    "detectar, como vamos ver daqui a pouco.")
add("Erro de compilação: o código nem chegou a rodar", verdict_slide("CE", "O código não compilou", "a saída do compilador é mostrada ao aluno"),
    "Erro de compilação: o compilador rejeitou o código. O aluno vê a saída do compilador, sempre, porque ela não "
    "depende de nenhum caso de teste escondido.")
add("Erro de execução: o programa quebrou no meio", verdict_slide("RE", "O programa terminou com erro", "divisão por zero · índice fora do vetor"),
    "Erro de execução: o programa terminou com código de saída diferente de zero ou foi morto por um sinal, como "
    "divisão por zero, índice fora do vetor ou exceção não tratada.")
add("O aluno vê o veredito de cada tentativa", shot("v4-verdicts-contest.png", "Seis tentativas, seis vereditos"),
    "É assim que aparece para o aluno, dentro de um torneio: cada tentativa com a hora, a linguagem e o veredito "
    "com a sua cor. Este aluno de demonstração errou, não compilou, estourou tempo, quebrou, estourou memória e "
    "por fim acertou.")
add("Erro de compilação não penaliza no placar", b_ce_penalty,
    "No placar, seguimos a convenção da ICPC: tentativas rejeitadas custam 20 minutos de penalidade quando o "
    "problema é resolvido, mas erro de compilação não conta. Quem não compilou não chegou a ser julgado. Erro do "
    "juiz também não penaliza.")
add("Memória excedida é deduzida, não detectada", b_mle,
    "Por que o MLE é difícil: o limite de memória do isolate, sem cgroups, é um limite de espaço de endereçamento. "
    "Quando estoura, o malloc simplesmente falha e o programa quebra; não há um sinal limpo de falta de memória. "
    "Então o judge deduz: se o pico de memória chegou a 90% do limite, ou se a saída de erro tem uma mensagem como "
    "MemoryError ou bad_alloc, é MLE. É uma heurística, e o benchmark mostra onde ela erra.")
add("A saída pode ser comparada de quatro jeitos", b_compare_modes,
    "Comparar a saída também ficou configurável por problema. Exata: idêntica, ignorando só espaços no começo e "
    "no fim. Tokens: palavra por palavra, espaços e quebras de linha não importam; é o padrão de problema novo. "
    "Float: números aceitos dentro de uma tolerância épsilon, absoluta ou relativa. E corretor: um programa do "
    "professor decide.")
add("Quando há várias respostas certas, um corretor decide", shot("v4-compare-checker.png", "Problema: imprima qualquer divisor de N"),
    "O corretor serve para problemas com mais de uma resposta certa. Neste exemplo, imprimir qualquer divisor de "
    "N: 12 aceita 2, 3, 4 ou 6. O professor escreve um pequeno programa que lê a entrada, a saída do aluno e a "
    "resposta esperada e decide. O código do corretor fica numa tabela separada e nunca chega ao aluno.")
add("O corretor recebe três arquivos e responde pelo código de saída", b_checker_protocol,
    "O protocolo é o do testlib: o corretor recebe três arquivos, input.txt, output.txt com a saída do aluno e "
    "answer.txt com a esperada. Código de saída zero é aceito; um é resposta errada, e o que ele imprimir vira a "
    "mensagem para o aluno; qualquer outra coisa, inclusive estourar o tempo ou não compilar, é erro do juiz, que "
    "não penaliza o aluno. O corretor roda no isolate como qualquer programa.")
add("Ignorar espaços aceita respostas certas que a comparação exata recusava", chart("compare_modes", "Saídas certas reescritas de jeitos comuns"),
    f"Para medir o impacto, peguei as saídas esperadas dos dez problemas de exemplo e as reescrevi como um "
    f"programa correto costuma escrever: espaço no fim da linha, linhas em branco, quebra de linha do Windows, "
    f"floats com outra precisão. O modo tokens aceita todas as de espaço; o exato recusa as de várias linhas. "
    f"Floats com outra precisão só passam no modo float: {RG['synthetic']['synthetic:float-format']['float_1e-6']} "
    f"de 12 com épsilon de um milionésimo. Erros de verdade, como faltar um número, continuam recusados. No "
    f"histórico real, as {RG['historical_mismatches']} respostas erradas que existiam eram todas erros de verdade: "
    f"nenhuma teria virado aceita.")

# ---- desempenho
section("04 · DESEMPENHO")
add("Medimos o judge com benchmarks reproduzíveis", b_section("Desempenho", "bench/ · dados brutos e scripts no repositório"),
    "Para a banca não ter que acreditar em mim, todos os números a seguir vêm de scripts no diretório bench do "
    "repositório, com os resultados brutos commitados. Máquina: Ryzen 5 5600, 6 núcleos e 12 threads, 32 GB de "
    "RAM, CachyOS. O judge roda na mesma imagem Docker de produção, contra um PostgreSQL descartável.")
add("O judge agora julga vários envios ao mesmo tempo", b_concurrency_arch,
    "A primeira mudança de desempenho: o judge virou um pool de workers. Um dispatcher escuta o NOTIFY, faz a "
    "varredura a cada 60 segundos e reaproveita envios travados; os workers pegam envios com FOR UPDATE SKIP "
    "LOCKED, então dois nunca pegam o mesmo. Cada worker tem a sua caixa do isolate. O número de workers vem de "
    "JUDGE_CONCURRENCY, por padrão o número de CPUs, até 4.")
add(f"4 workers julgam {fmt(CC['burst100-n4']['speedup_vs_n1'])}× mais rápido; 8 workers, {fmt(CC['burst100-n8']['speedup_vs_n1'])}×",
    chart("concurrency_throughput", "Rajada de envios nas 6 linguagens, 5 testes cada"),
    f"O benchmark simula uma turma apertando enviar ao mesmo tempo: 40 ou 100 envios de uma vez, misturando as "
    f"seis linguagens, contra o judge real e um PostgreSQL real. Com um worker, 100 envios levam "
    f"{fmt(c100['wall_s'], 0)} segundos. Com 4, {fmt(CC['burst100-n4']['wall_s'], 0)}; com 8, "
    f"{fmt(CC['burst100-n8']['wall_s'], 0)}. Não escala linearmente porque compiladores e a JVM disputam CPU e "
    f"disco. Todos os envios passaram em todas as rodadas.")
add(f"Com 8 workers, metade da turma espera menos de {fmt(CC['burst100-n8']['latency_p50_s'], 0)} s, não {fmt(c100['latency_p50_s'], 0)} s",
    chart("concurrency_latency", "Rajada de 100 envios: espera até o veredito"),
    f"O que o aluno sente é a espera. Numa rajada de 100, com um worker a mediana é {fmt(c100['latency_p50_s'], 0)} "
    f"segundos e o percentil 95 é {fmt(c100['latency_p95_s'], 0)}: o último aluno espera mais de dois minutos. "
    f"Com 8 workers, a mediana cai para {fmt(CC['burst100-n8']['latency_p50_s'], 0)} segundos e o p95 para "
    f"{fmt(CC['burst100-n8']['latency_p95_s'], 0)}.")
add("Em 1 CPU, mais workers não ajudam, e a produção roda assim", chart("concurrency_1cpu", "Mesma rajada de 40, com o contêiner preso a 1 CPU"),
    f"Agora a parte honesta. Em produção, o judge roda numa máquina shared-cpu-1x da Fly.io, com uma vCPU. Lá o "
    f"padrão resolve para um worker. Prendi o contêiner a uma CPU e repeti: com 1 worker, "
    f"{fmt(CC['burst40-n1-1cpu']['wall_s'], 0)} segundos; com 4, {fmt(CC['burst40-n4-1cpu']['wall_s'], 0)}. Nenhum "
    f"ganho. O pool só ajuda com uma máquina de vários núcleos, o que fica como trabalho futuro. Pelo menos não "
    f"houve tempo excedido espúrio com 4 workers numa CPU.")
add("Sem fila, o veredito sai em menos de 0,4 s, exceto Java e Portugol",
    chart("e2e_stages", "Um envio por vez, judge ocioso, 5 casos de teste"),
    f"Com o judge ocioso, quanto tempo leva um envio? Do INSERT até o judge pegar a linha: cerca de "
    f"{E2E['c']['queue_ms']} milissegundo, o NOTIFY é imediato. C fica pronto em {ms(E2E['c']['total_ms'])}, Python "
    f"em {ms(E2E['python']['total_ms'])}, C++ e Rust em cerca de {ms(E2E['cpp']['total_ms'])}, Java em "
    f"{ms(E2E['java']['total_ms'])}. Portugol leva {ms(E2E['portugol']['total_ms'])}, porque o interpretador "
    f"recompila o programa em cada um dos cinco casos de teste.")
add("Compilar custa mais que rodar, exceto no Portugol", chart("lang_time", "Mediana de 6 execuções no isolate"),
    f"Separando compilação e execução: C compila em {LC['c']['compile_ms']} ms, C++ em {LC['cpp']['compile_ms']}, "
    f"Rust em {LC['rust']['compile_ms']}, Java em {LC['java']['compile_ms']}. Rodar um olá mundo leva poucos "
    f"milissegundos, exceto Portugol: {fmt(LC['portugol']['run_hello_ms'] / 1000)} segundo. No laço de dez milhões "
    f"de passos, Python leva {fmt(LC['python']['run_cpu_ms'] / 1000)} segundo e C {LC['c']['run_cpu_ms']} ms. A "
    f"primeira execução não foi mais lenta que as outras: não medi efeito de cache frio dentro do contêiner.")
add("Java e Portugol usam dezenas de vezes mais memória", chart("lang_memory", "Pico de memória no laço de 10⁷ passos"),
    f"Memória: C, C++ e Rust ficam abaixo de 4 MB, Python em {fmt(LC['python']['peak_mb_cpu'])} MB. Java usa "
    f"{fmt(LC['java']['peak_mb_cpu'], 0)} MB e Portugol {fmt(LC['portugol']['peak_mb_cpu'], 0)}, por causa da JVM. "
    f"É por isso que as linguagens da JVM têm um limite nominal maior, de 2 GB de espaço de endereçamento, com o "
    f"heap real limitado por flags da JVM.")
add(f"O isolate custa cerca de {fmt(SB['c_hello']['overhead_ms'], 0)} ms por execução", chart("sandbox_overhead", "Mesmo programa, com e sem caixa"),
    f"Quanto custa a segurança? Rodei o mesmo programa direto e dentro do isolate, com criação e destruição da "
    f"caixa. O custo extra é de {fmt(SB['c_hello']['overhead_ms'], 0)} a {fmt(SB['java_hello']['overhead_ms'], 0)} "
    f"ms por execução na maioria das linguagens, e {fmt(SB['rust_hello']['overhead_ms'], 0)} em Rust. Só criar e "
    f"destruir uma caixa vazia leva {fmt(SB['box_lifecycle_ms_median'])} ms. No Portugol a diferença some no ruído "
    f"do segundo e pouco que ele já leva.")
add(f"O judge acertou {VD['correct']} de {VD['programs']} vereditos; os erros têm causa conhecida",
    chart("verdict_confusion", "2 programas por veredito × 6 linguagens"),
    f"Para testar os vereditos, escrevi dois programas para cada veredito em cada linguagem: 72 programas, "
    f"julgados pelo código real. Aceito, resposta errada e tempo excedido: 100%. Os erros têm três causas. "
    f"Primeira: o console do Portugol imprime erros de compilação e de execução na saída padrão e termina com "
    f"código zero, então o judge vê uma resposta errada; são 6 dos 9 erros, e é uma limitação a corrigir. "
    f"Segunda: Python não tem etapa de compilação, então erro de sintaxe vira erro de execução. Terceira: o MLE "
    f"é heurístico; um programa em C que escreve num malloc que falhou quebra com falha de segmentação e vira "
    f"erro de execução. Fora do Portugol, foram 57 de 60.")
add(f"{TESTS['judge']['tests']} testes no judge, {TESTS['web']['tests']} no site",
    b_big_numbers([(str(TESTS["judge"]["tests"]), "testes do judge", "accent1"),
                   (str(TESTS["web"]["tests"]), "testes do site", "accent5")]),
    f"A validação técnica: o judge tem {TESTS['judge']['tests']} testes automatizados, 20 deles rodando código de "
    f"verdade no isolate, incluindo fork bomb, laço infinito e estouro de memória. O site tem "
    f"{TESTS['web']['tests']} testes em {TESTS['web']['files']} arquivos, das funções puras: placar, boletim, "
    f"plágio, pesquisa, relatório do judge. Os benchmarks são testes ignorados à parte.")
add("Cada push roda três jobs no GitHub Actions", b_ci,
    "Desde a última apresentação há integração contínua: cada push e pull request roda três jobs. Web: checagem "
    "de tipos, lint com Biome e testes. Judge: formatação, clippy e os 31 testes que não precisam do sandbox; os "
    "20 testes que rodam código de verdade no isolate precisam de capabilities elevadas e rodam localmente na "
    "imagem do judge. E um job que confere se os enums do Rust e do Drizzle estão em sincronia.")
add(f"O CI leva cerca de {fmt(CI['run_wall_median_s'], 0)} s por push", chart("ci_jobs"),
    f"Nas {CI['runs']} execuções até agora, todas passaram. A mediana é {fmt(CI['jobs']['web']['median_s'], 0)} "
    f"segundos para o job web e {fmt(CI['jobs']['judge']['median_s'], 0)} para o judge; os pontos mais à direita do "
    f"judge são execuções sem cache do Cargo, até {fmt(CI['jobs']['judge']['max_s'], 0)} segundos.")
add("Um script garante que Rust e TypeScript concordam nos enums", b_enum_sync,
    "Por que um job só para enums? O judge e o site compartilham o banco, mas não o código: o status da "
    "submissão e a linguagem são enums definidos duas vezes, em Rust e no Drizzle. Se um lado ganhar um valor e o "
    "outro não, o judge quebra ao ler a linha. O script check-enum-sync compara os dois e falha o CI.")

# ---- professor
section("05 · O PROFESSOR")
add("O professor cria problemas, torneios e aulas", b_section("O professor", "problemas · torneios · aulas"),
    "Agora o lado do professor.")
add("Nenhum problema é publicado sem uma solução que passa", shot("validacao-aprovada.png"),
    "Antes de publicar, o autor precisa provar que os casos de teste estão certos: escolhe uma linguagem, cola "
    "uma solução de referência ou pede para a IA gerar uma, e o judge roda a solução contra todos os casos. Se "
    "alguma saída não bate, o erro está no caso de teste. Se ele mudar um teste depois, a publicação trava até "
    "validar de novo.")
add(f"A IA escreveu soluções que passaram em {AIR['python']['passed'] + AIR['c']['passed']} de 20 problemas",
    chart("ai_reference", "Soluções de referência geradas pela IA, julgadas pelo judge"),
    f"Medi isso: pedi à IA soluções de referência em Python e em C para os dez problemas de exemplo e julguei "
    f"todas no judge. Python passou em {AIR['python']['passed']} de 10; C em {AIR['c']['passed']} de 10. As duas "
    f"falhas vieram do último modelo da cadeia, o Claude Haiku, que escreveu uma frase antes do código, apesar da "
    f"instrução; não compilou. É exatamente o caso que a validação antes de publicar existe para pegar.")
add("A IA sugere a narrativa e as tags do problema", shot("ia-narrativa-tags.png"),
    "Duas ajudas de IA na criação: a narrativa, uma pequena história no estilo do Advent of Code para "
    "contextualizar o enunciado; e as tags, de um catálogo fixo de temas. As duas só preenchem o formulário; nada "
    "é salvo sem o professor.")
add("A IA aponta casos de borda que faltam nos testes", shot("ia-revisao-casos-borda.png"),
    "A revisão com IA lê o enunciado e os casos de teste e sugere casos de borda que faltam, como n igual a 1 ou "
    "um valor que estoura 32 bits. Cada sugestão entra nos testes com um clique.")
add("O professor vê o problema como o aluno vai ver", shot("previsualizacao.png"),
    "A pré-visualização mostra o enunciado renderizado, com Markdown e LaTeX, exatamente como o aluno vai ver.")
add(f"Cada ajuda da IA leva de {fmt(min(v['median'] for v in AI['latency_s'].values()), 0)} a {fmt(max(v['median'] for v in AI['latency_s'].values()), 0)} s",
    chart("ai_latency", "10 chamadas por recurso (20 na solução de referência)"),
    f"Quanto tempo a IA leva? Fiz 10 chamadas de cada recurso com os prompts reais: {AI['calls_logical']} "
    f"chamadas no total. As medianas ficaram entre {fmt(min(v['median'] for v in AI['latency_s'].values()))} e "
    f"{fmt(max(v['median'] for v in AI['latency_s'].values()))} segundos. Esse tempo inclui as tentativas que "
    f"falharam antes do fallback responder, o que explica os pontos acima de 30 segundos.")
add("A cadeia de modelos salvou mais da metade das chamadas", b_fallback,
    f"E falharam bastante: durante o teste a chave do Gemini Flash estourou a cota, com erro 429. Das "
    f"{AI['calls_logical']} chamadas, {AI['calls_with_fallback']} precisaram de pelo menos um fallback; o "
    f"Flash-Lite respondeu {AI['answered_by_model'].get('gemini-3.5-flash-lite', 0)} e o Haiku "
    f"{AI['answered_by_model'].get('claude-haiku-5-5', 0)}. Nenhuma chamada ficou sem resposta. Sem a cadeia, "
    f"mais da metade teria virado mensagem de erro.")
add("O banco de problemas filtra por código, tema e dificuldade", shot("lista-problemas-filtros.png"),
    "O banco de problemas: busca por título ou pelo código do problema, como DEMO-101, filtro por dificuldade, "
    "por tags agrupadas e só pelos meus problemas.")
add("Vários problemas entram de uma vez por JSON", shot("v4-problem-import.png"),
    "E a importação: vários problemas de uma vez a partir de um arquivo JSON, com o formato documentado na "
    "própria tela e um modelo para baixar. Erro de formato aponta o problema e o campo.")
add("O torneio se configura em uma tela", shot("v4-contest-settings.png", "Nome, datas, privado e nível de IA"),
    "Criar um torneio: nome, descrição, datas, se é privado e o nível máximo de ajuda da IA. A mudança de nível "
    "vale a partir do próximo pedido.")
add("Problemas entram no torneio pelo código", shot("torneio-busca-codigo.png"),
    "Os problemas são buscados pelo código e viram A, B, C, D na ordem escolhida.")
add("No torneio privado, o professor aprova quem entra", shot("v4-contest-join-requests.png"),
    "Num torneio privado, o aluno pede para entrar e o professor aprova ou rejeita. O pedido gera uma "
    "notificação para o professor, e a aprovação uma para o aluno.")
add("O professor decide quanto a IA ajuda no torneio", b_ai_levels,
    "No torneio, a IA tem quatro níveis: desligada; conceito, que só nomeia a área do erro; dica, que explica o "
    "que está errado sem código; e precisa, que aponta a linha. O professor define o máximo, o servidor aplica, e "
    "o aluno libera um nível por vez.")
add("Placar no estilo das maratonas de programação", shot("v4-standings.png"),
    "O placar segue as maratonas: em cada célula, as tentativas e o minuto do acerto; verde é resolvido, vermelho "
    "só tentativas erradas; e atualiza sozinho durante o torneio.")
add("Cada célula conta tentativas, minuto e quem resolveu primeiro", b_legend,
    "Lendo uma célula: 2 tentativas, resolvido no minuto 22, e a estrela marca o primeiro a resolver aquele "
    "problema. Empate em número de problemas é desfeito pela penalidade: soma dos minutos dos acertos mais 20 "
    "por tentativa errada antes do acerto. Erro de compilação não conta.")
add(f"Placar de 1000 alunos em {fmt(WC['standings@1000']['ms'] / 1000, 2)} s; boletim em {fmt(WC['gradebook+csv@1000']['ms'] / 1000, 2)} s",
    chart("web_compute", "Cálculo puro, sem banco, dados sintéticos"),
    f"O placar e o boletim são calculados no servidor a cada visita. Com turmas sintéticas bem maiores que uma "
    f"turma real: placar de 1000 alunos e {WC['standings@1000']['records']} envios em "
    f"{fmt(WC['standings@1000']['ms'], 0)} ms; boletim de 1000 alunos com 240 exercícios em "
    f"{fmt(WC['gradebook+csv@1000']['ms'], 0)} ms. Numa turma de 30, os dois ficam abaixo de 2 ms. O tempo de "
    f"banco não está incluído.")

# ---- aluno
section("06 · O ALUNO")
add("O aluno resolve, envia e entende o erro", b_section("O aluno", "resolver · entender · voltar"),
    "Agora o lado do aluno.")
add("A tela inicial mostra o que falta fazer", shot("v4-home.png"),
    "A nova tela inicial: exercícios pendentes da turma, o último torneio, o que resolveu recentemente e "
    "sugestões de problemas. É a primeira coisa que o aluno vê depois de entrar.")
add("O editor salva sozinho no navegador", shot("editor-autosave.png"),
    "O editor é o Monaco, o mesmo do VS Code, com destaque de sintaxe nas seis linguagens. O código é salvo no "
    "navegador por problema e linguagem, então fechar a aba não perde nada.")
add("Cada envio guarda o código e pode pedir explicação", shot("submissoes-explicar.png"),
    "Cada envio guarda o código, então o aluno sabe qual versão deu qual veredito, e pode copiar. O botão "
    "Explicar pede à IA uma dica sobre o erro, dentro do limite do torneio.")
add("O caso que falhou mostra entrada, saída e esperado", shot("torneio-editor.png"),
    "Quando o caso que falhou é um exemplo público, o aluno vê a entrada, a própria saída e a esperada. Se for um "
    "caso escondido, vê só o veredito e o número do caso, para não dar para extrair os testes.")
add("Ctrl K abre uma busca que leva a qualquer lugar", shot("v4-command-palette.png"),
    "A paleta de comandos: Ctrl K abre uma busca por problemas, páginas e ações, como criar turma.")
add("O atalho aparece no próprio menu", shot("v4-command-palette-hint.png"),
    "E para ninguém precisar adivinhar o atalho, ele aparece no menu, junto do botão de busca.")
add("Notificações avisam o veredito e as aprovações", shot("v4-notifications.png"),
    "As notificações avisam quando uma submissão foi julgada, quando um pedido para entrar num torneio foi "
    "aprovado e quando uma nova lição foi liberada. Eventos repetidos se agrupam numa entrada só.")
add("O perfil mostra os torneios e problemas de cada um", shot("v4-profile.png"),
    "O perfil público de cada usuário, com foto, capa e cor, e as abas de torneios e problemas.")
add("Seis temas, ou um tema próprio", shot("v4-settings-theme.png"),
    "Nas configurações, o aluno escolhe claro ou escuro e um entre seis temas, ou monta o próprio.")
add("Até a página de erro fala a língua do programador", shot("v4-404.png"),
    "Um detalhe: a página 404 imita uma saída de terminal com erro de execução.")

# ---- aulas
section("07 · AULAS E TURMA")
add("A turma tem aulas com prazo e revisão", b_section("Aulas e turma", "listas de exercícios do professor"),
    "Além dos torneios, o professor monta aulas.")
add("O aluno entra na turma com um código de seis letras", shot("turma-codigo.png"),
    "Para entrar na turma, o aluno digita um código de seis letras, como ALG26B.")
add("As aulas da turma têm prazo", shot("v4-class-lessons.png"),
    "Cada aula é uma lista de exercícios com prazo. Depois do prazo o professor revisa as entregas.")
add("Blocos para quem nunca programou", shot("formato-blocos.png"),
    "O modo blocos, no estilo Scratch: os blocos têm rótulos em português e viram Portugol, que roda no judge "
    "como qualquer outra linguagem. O aluno pode abrir o código gerado.")
add("Parsons: ordenar as linhas certas", shot("formato-parsons.png"),
    "O modo Parsons: o aluno recebe as linhas da solução do professor, embaralhadas, e só ordena e indenta. A "
    "solução do professor precisa passar no judge antes de virar exercício.")
add("O professor exige como resolver, não só o resultado", shot("solution-constraints.png"),
    "As restrições de solução: limite de laços aninhados, construções proibidas ou obrigatórias, e um algoritmo "
    "exigido, verificado pela IA. Uma solução correta que viola a restrição recebe um veredito próprio.")
add(f"Restrições acertam código real e erram texto em strings e comentários",
    chart("constraints_accuracy", f"{CS['samples']} amostras rotuladas à mão"),
    f"As restrições estruturais analisam o texto do código, não uma árvore sintática. Medi com "
    f"{CS['samples']} amostras: violações reais, código limpo e nomes que contêm a palavra proibida, todos "
    f"certos. Mas quando a palavra está dentro de uma string ou de um comentário, o verificador erra "
    f"{CS['trap_errors']} de {CS['traps']} vezes. É uma limitação conhecida; um parser por linguagem é trabalho "
    f"futuro.")
add("O professor revisa e comenta cada exercício", shot("revisao-professor.png"),
    "Depois do prazo, o professor revisa: nota automática pela fração de casos que passaram, e um comentário por "
    "exercício.")
add("Notas da turma inteira numa tabela", shot("v4-gradebook.png"),
    "O boletim: cada aluno numa linha, cada exercício numa coluna, com a soma por aula e o total. Traço indica "
    "aula não entregue. As notas vêm do mesmo cálculo da revisão, então os dois nunca discordam.")
add("O CSV abre certo no Excel e não executa fórmulas", b_csv,
    "O boletim exporta para CSV. Três cuidados: segue a RFC 4180 para aspas e quebras de linha; começa com um "
    "BOM para o Excel abrir os acentos certos; e neutraliza células que começam com igual, mais, menos ou "
    "arroba, para um nome de aluno malicioso não virar fórmula no Excel do professor.")

# ---- plágio
section("08 · PLÁGIO")
add("O professor agora vê quem copiou de quem", b_section("Plágio", "similaridade de código, estilo MOSS"),
    "Uma funcionalidade nova desde a última apresentação: detecção de plágio.")
add("O código vira impressões digitais antes da comparação", b_plag_pipeline,
    "O algoritmo é o do MOSS, de Schleimer, Wilkerson e Aiken. O código vira tokens, com um tokenizador por "
    "linguagem. Grupos de 5 tokens viram hashes, os k-gramas. O winnowing escolhe o menor hash de cada janela, e "
    "esses são as impressões digitais. Pares de alunos que compartilham impressões são comparados por greedy "
    "string tiling, que encontra os trechos iguais, e a similaridade é a fração de tokens cobertos.")
add("Renomear variáveis não engana a comparação", b_normalize,
    "O truque está na normalização: identificadores viram V, números viram N, strings viram S, e comentários e "
    "espaços somem. Renomear variáveis e reformatar o código não muda nada do que é comparado. Além disso, o "
    "código que a maioria da turma compartilha, como o esqueleto do problema, é descontado.")
add("O relatório lista os pares mais parecidos", shot("v4-similarity-pairs.png"),
    "O relatório, só para o dono do torneio ou da turma, e só quando ele pede: escolhe o problema, se compara "
    "o último envio ou o melhor de cada aluno, e a similaridade mínima. A tela avisa: nota alta é motivo para ler "
    "os dois códigos, não prova de cópia.")
add("Lado a lado, os trechos iguais aparecem destacados", shot("v4-similarity-side-by-side.png"),
    "Clicando no par, os dois códigos aparecem lado a lado, com os trechos coincidentes da mesma cor. Aqui a "
    "aluna renomeou tudo e adicionou comentários: cem por cento coincidente mesmo assim.")
add("A comparação também funciona dentro das aulas", shot("v4-similarity-exercise.png"),
    "A mesma comparação existe para cada exercício de uma aula.")
add(f"Cópias ofuscadas ficam acima de {fmt(PQ['best_f1_pair']['threshold'], 2)}; soluções independentes, abaixo",
    chart("plagiarism_levels", "36 soluções originais, 6 ofuscações cada"),
    f"Para medir a qualidade, escrevi 36 soluções independentes: 4 problemas, em Python, C e Java, cada um com 3 "
    f"autores de estilos diferentes. Cada uma ganhou 6 cópias ofuscadas automaticamente: renomear, reformatar, "
    f"comentários, reordenar funções, inserir código morto e tudo junto. Renomear, reformatar e comentários dão "
    f"100%. Reordenar e código morto caem um pouco; tudo junto tem mediana de "
    f"{fmt(PQ['median_by_level_pair']['combined'] * 100, 0)}%. Soluções independentes do mesmo problema ficam em "
    f"{fmt(PQ['median_by_level_pair']['independent'] * 100, 0)}% de mediana.")
add(f"Com o limiar de {fmt(PQ['best_f1_pair']['threshold'], 2)}, {fmt(PQ['best_f1_pair']['precision'] * 100, 0)}% de precisão e {fmt(PQ['best_f1_pair']['recall'] * 100, 1)}% de revocação",
    chart("plagiarism_roc", f"{PQ['copies']} cópias contra {PQ['negatives_same_problem'] + PQ['negatives_other_problem']} pares independentes"),
    f"Na curva ROC, a área é {fmt(PQ['auc_pair_all_negatives'], 3)} comparando par a par. O melhor limiar foi "
    f"{fmt(PQ['best_f1_pair']['threshold'], 2)}: {fmt(PQ['best_f1_pair']['precision'] * 100, 1)}% de precisão e "
    f"{fmt(PQ['best_f1_pair']['recall'] * 100, 1)}% de revocação. No relatório da turma, com o filtro de código "
    f"comum, a separação foi perfeita neste conjunto: nenhuma solução independente passou de "
    f"{fmt(PQ['max_independent_class'] * 100, 0)}%. Cuidado: as ofuscações são automáticas e sistemáticas, não as "
    f"de um aluno esperto.")
add(f"200 alunos comparados em menos de meio segundo", chart("plagiarism_perf", "Um exercício, uma linguagem, todos os pares"),
    f"O custo cresce com o quadrado do número de alunos, porque compara todos os pares. Mesmo assim: 30 alunos em "
    f"cerca de {fmt(PP['python']['30'], 0)} ms, 200 alunos em {fmt(PP['python']['200'], 0)} a "
    f"{fmt(PP['c']['200'], 0)} ms, 300, o máximo do relatório, em menos de um segundo.")
add("Plágio entre linguagens e código de IA passam despercebidos", b_limit("Só compara a mesma linguagem; não detecta código gerado por IA."),
    "Duas limitações: só compara envios na mesma linguagem, então traduzir de Python para C escapa. E não detecta "
    "código gerado por IA: duas respostas do ChatGPT para o mesmo aluno não são cópia uma da outra. Detectar "
    "código de IA fica como trabalho futuro.")

# ---- avaliação
section("09 · AVALIAÇÃO")
add("Um teste informal já mudou o sistema", b_pilot_intro,
    "Antes da avaliação formal, cinco colegas usaram o sistema no meu servidor do Discord, sem roteiro nem "
    "questionário. É um teste informal, não a avaliação.")
add("O que incomodou virou mudança", b_pilot_changes,
    "Três reclamações viraram mudanças: o torneio não mostrava o código de cada tentativa; o placar só mostrava "
    "medalhas; e o erro de importar JSON dizia só Invalid format. Todas foram corrigidas antes da versão 3.")
add("Gostaram do visual e do nome", b_pilot_liked,
    "Do lado bom: o tema escuro, estilo terminal, e o nome. O Why lido como o uai mineiro, que é justamente a "
    "ideia de explicar por que o código falhou.")
add("A pesquisa aparece dentro do sistema, no fim da atividade", shot("v4-survey-banner.png"),
    "Para a avaliação de verdade, os questionários estão dentro do próprio sistema. Quando o torneio ou a lista "
    "termina, aparece este convite para quem participou. O servidor decide quem pode responder.")
add("Quatro questionários, com termo de consentimento", shot("v4-survey-tcle.png"),
    "São quatro formulários: professor e aluno, para torneio e para lista de exercícios. Todos começam pelo termo "
    "de consentimento; as respostas são anônimas na análise.")
add("A usabilidade é medida pelo SUS", shot("v4-survey-sus.png"),
    "A usabilidade é medida pela System Usability Scale, de Brooke: dez afirmações de 1 a 5, e o sistema calcula "
    "a nota de 0 a 100 automaticamente.")
add("Os resultados saem prontos, anônimos e em CSV", shot("v4-survey-results.png", "Ainda sem respostas"),
    "A página de resultados, só para o pesquisador: número de respostas, SUS médio, mediana e desvio, filtro por "
    "atividade e exportação em CSV. Está vazia porque ainda não aplicamos com alunos.")
add("O primeiro teste em sala é em 29/10/2026", b_date,
    "E aqui está o ponto mais importante: a avaliação com alunos ainda não aconteceu. O primeiro teste em sala "
    "está marcado para 29 de outubro de 2026, com um torneio e uma lista de exercícios, e os questionários no "
    "final. Não há resultados ainda, e nenhum número desta apresentação vem de alunos.")

# ---- discussão
section("10 · DISCUSSÃO")
add("O que o sistema faz bem", b_strengths,
    "Pontos fortes: não há fila externa, só o PostgreSQL; o isolamento é o da IOI, sem Docker privilegiado; e a "
    "IA está sob controle do professor, com entrada delimitada contra prompt injection.")
add("Limitação: ainda sem avaliação com alunos", b_limit("A pergunta de pesquisa ainda não tem resposta."),
    "A primeira limitação é a maior: sem o teste em sala, a pergunta de pesquisa continua sem resposta.")
add("Limitação: em produção, o judge tem uma CPU só", b_limit("Na Fly.io, 1 vCPU: concorrência sem ganho."),
    "Em produção o judge roda numa vCPU, e o benchmark mostrou que aí o pool de workers não ajuda.")
add("Limitação: erros do Portugol viram resposta errada", b_limit("O console do Portugol termina com código 0 mesmo com erro."),
    "O benchmark de vereditos achou isto: o console do Portugol imprime erros na saída padrão e termina com "
    "sucesso, então erro de compilação e de execução viram resposta errada. A correção é reconhecer as mensagens "
    "de erro dele.")
add("Limitação: memória excedida é heurística", b_limit("Sem cgroups, não há sinal limpo de falta de memória."),
    "O MLE depende de pico de memória e de mensagens de erro; um programa que quebra antes de usar a memória vira "
    "erro de execução. O modo cgroups do isolate resolveria, mas exige mais configuração do host.")
add("Limitação: restrições leem texto, não a árvore do código", b_limit("Palavras em strings e comentários disparam falso positivo."),
    "As restrições estruturais são uma busca no texto; strings e comentários enganam. Um parser por linguagem "
    "resolveria.")
add("Próximos passos depois do teste em sala", b_future,
    "Trabalhos futuros: detectar código gerado por IA; ativar o modo cgroups do isolate, que dá limite de memória "
    "por caixa e um sinal limpo de estouro; e um judge com vários núcleos em produção, para o pool de workers "
    "valer a pena. E, claro, a avaliação em sala.")
add("Próximas etapas, em ordem", b_cronograma, "As próximas etapas, em ordem: o teste em sala no dia 29, a análise "
    "dos dados, com o SUS e os dados de uso do próprio sistema, e a defesa.", kicker="10 · CRONOGRAMA")
reuse(13, None, edit_references,
      "As referências, incluindo o artigo do winnowing de Schleimer, Wilkerson e Aiken, base da detecção de "
      "plágio, e o SUS de Brooke, usado nos questionários.")
add("Obrigado!", b_thanks, "Obrigado. Fico à disposição para perguntas.", kicker="WHYRUNNER")


# ------------------------------------------------------------------ build ----


def lint():
    problems = []
    for i, (kind, _, _, title, builder, notes) in enumerate(SLIDES, 1):
        if not notes or len(notes.split()) < 4:
            problems.append(f"slide {i}: missing notes")
        if kind == "new":
            s = S()
            builder(s)
            if s.words > MAX_BODY_WORDS:
                problems.append(f"slide {i} ({title[:40]}): {s.words} body words")
            if s.words and len(s.images) > 1:
                problems.append(f"slide {i}: {len(s.images)} images")
    return problems


def build():
    for p in lint():
        print("LINT", p)
    tmp = Path(tempfile.mkdtemp())
    with zipfile.ZipFile(SRC) as z:
        z.extractall(tmp)
    ppt = tmp / "ppt"
    template = (ppt / "slides/slide14.xml").read_text("utf-8")
    sp = re.findall(r"<p:sp>.*?</p:sp>", template, re.S)
    head = template[:template.index(sp[2])]
    tail = template[template.index(sp[-1]):]
    notes_tpl = (ppt / "notesSlides/notesSlide14.xml").read_text("utf-8")

    ct = (tmp / "[Content_Types].xml").read_text("utf-8")
    prels = (ppt / "_rels/presentation.xml.rels").read_text("utf-8")
    pres = (ppt / "presentation.xml").read_text("utf-8")
    v3_rid = {int(n): r for r, n in re.findall(r'Id="(rId\d+)"[^>]*Target="slides/slide(\d+)\.xml"', prels)}
    next_rid = max(int(r) for r in re.findall(r'Id="rId(\d+)"', prels)) + 1
    used = {n for kind, n, *_ in SLIDES if kind == "v3"}

    # drop the v3 slides v4 does not reuse
    for n, rid in v3_rid.items():
        if n in used:
            continue
        prels = re.sub(rf'<Relationship Id="{rid}"[^>]*/>', "", prels)
        for part in (f"slides/slide{n}.xml", f"notesSlides/notesSlide{n}.xml"):
            ct = ct.replace(f'<Override PartName="/ppt/{part}" ContentType="{CT_SLIDE if "slides/" == part[:7] else CT_NOTES}"/>', "")
            (ppt / part).unlink()
            rels = ppt / part.replace("/", "/_rels/", 1).replace(".xml", ".xml.rels")
            rels.unlink(missing_ok=True)

    next_slide = 23
    sld_entries, sid = [], 256
    for i, (kind, n, kicker, title, fn, notes) in enumerate(SLIDES, 1):
        if kind == "v3":
            f = ppt / f"slides/slide{n}.xml"
            x = f.read_text("utf-8")
            if kicker:
                x = set_kicker(x, kicker)
            if fn:
                x = fn(x)
            f.write_text(widen_slide_number(x), "utf-8")
            nf = ppt / f"notesSlides/notesSlide{n}.xml"
            nf.write_text(set_notes(nf.read_text("utf-8"), notes), "utf-8")
            rid = v3_rid[n]
        else:
            n = next_slide
            next_slide += 1
            s = S(20)
            fn(s)
            x = set_title(set_kicker(head, kicker), title) + "".join(s.xml) + tail
            x = widen_slide_number(re.sub(r'<p:cSld name="[^"]*">', f'<p:cSld name="Slide {n}">', x))
            (ppt / f"slides/slide{n}.xml").write_text(x, "utf-8")
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

    # media no remaining part points to
    referenced = set()
    for rels in ppt.rglob("*.rels"):
        referenced |= set(re.findall(r'Target="\.\./media/([^"]+)"', rels.read_text("utf-8")))
    for m in (ppt / "media").iterdir():
        if m.name not in referenced:
            m.unlink()

    pres = re.sub(r"<p:sldIdLst>.*?</p:sldIdLst>", "<p:sldIdLst>" + "".join(sld_entries) + "</p:sldIdLst>", pres, flags=re.S)
    (ppt / "presentation.xml").write_text(pres, "utf-8")
    (ppt / "_rels/presentation.xml.rels").write_text(prels, "utf-8")
    # v3 inherited overrides for slide masters that were never in the package
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
    (HERE / "v4-slides.txt").write_text("".join(
        f"{i:3d}  {k or '(v3)'}  |  {t or '(v3 slide ' + str(n) + ')'}\n"
        for i, (kind, n, k, t, _, _) in enumerate(SLIDES, 1)), "utf-8")


if __name__ == "__main__":
    build()
