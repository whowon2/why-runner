#!/usr/bin/env python3
"""Build the VIII WSI banner (A1 portrait poster) for the WhyRunner TCC.

    python docs/wsi/build_banner.py [--build-dir DIR] [--soffice CMD] [--fonts DIR]

Reads   docs/wsi/ModeloPosterWSI.pptx  (the official WSI template, untouched)
        bench/results/                 (charts are redrawn by bench/charts.py)
Writes  docs/wsi/banner.pdf            (the only file written inside the repo)

Everything intermediate (the filled .pptx, the poster-sized charts) goes to
--build-dir, a fresh temporary directory by default, so no build artifact is
left in the repository.

Kept from the template: header (WSI and IFMG logos, blue rule), title,
authors and institution lines, the two-column section order (Introdução,
Desenvolvimento + Figura 1 on the left; Resultados e Discussões, Conclusões,
Agradecimentos on the right), Poppins type, the 89BCCF blue and the footer.
The body boxes are cloned from the template's own text boxes, so they keep
its paragraph and run formatting; only text and vertical positions change.

Layout is computed: every text block is wrapped with the real Poppins
metrics (Pillow), and the next block is placed below it. A final check fails
the build if a column runs into the footer.

Needs: python-pptx, Pillow, matplotlib, numpy; the Poppins TTFs (Regular,
Bold; from Google Fonts) in --fonts or installed system-wide; LibreOffice
(`soffice`, or any command with the same CLI passed in --soffice).
"""

import argparse
import copy
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from lxml import etree
from PIL import ImageFont
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_CONNECTOR, MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.oxml.ns import qn
from pptx.util import Emu, Pt

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
TEMPLATE = HERE / "ModeloPosterWSI.pptx"
OUT_PDF = HERE / "banner.pdf"

CM = 360000  # EMU per cm
INK = "0D0D0D"
MUTED = "4D4D4D"
BLUE = "89BCCF"  # template accent (header rule, footer)
BLUE_DARK = "1F5C73"  # same hue, dark enough for text on white
TINT = "EAF3F7"  # same hue, card background
GREEN = "2F9E41"  # IF logo green
GREEN_TINT = "E9F5EB"

# Columns, from the template's body boxes.
LEFT_X, RIGHT_X, COL_W = 3.84, 31.69, 23.93
BOTTOM = 78.6  # the footer bar starts at 79.7 cm

ALLOW_OVERFLOW = False  # --draft: render even if a column is too long

BODY_PT = 24  # the template's body size
LINE = 1.5  # rendered line height / font size for Poppins at the template's 120 %


# --------------------------------------------------------------- content ----

TITLE = "WhyRunner: Online Judge for Competitive Programming"
AUTHORS = [("Juan Israel dos Anjos", "¹"), ("Suelen Mapa (orientadora)", "¹")]
INSTITUTION = [("1.", True), (" Instituto Federal de Minas Gerais (IFMG) – Campus Ouro Branco", False)]

# A paragraph is a list of runs (text, bold); a bullet paragraph is ("•", runs).
# Every fact below is stated in overleaf/main.tex.
INTRO = [
    [("Juízes online corrigem programas contra casos de teste, mas nasceram para competições: o aluno "
      "recebe só “Wrong Answer”, sem explicação. O ", False), ("WhyRunner", True),
     (" é um juiz online voltado ao ensino, com feedback por IA, execução segura e escalável em várias "
      "linguagens, e competições e listas de exercícios para a sala de aula.", False)],
]

DEV = [
    [("A aplicação web grava cada envio no PostgreSQL e emite ", False), ("NOTIFY", True),
     ("; o judge, em Rust, distribui os envios entre N workers, sem fila externa (Figura 1).", False)],
    ("•", [("Sandbox isolate:", True),
           (" caixa nova por caso de teste, sem rede, com limites de tempo, memória e processos.", False)]),
    ("•", [("Vereditos de maratona", True), (" (WA, TLE, MLE, CE, RE) e quatro modos de comparação de saída.",
                                              False)]),
    ("•", [("Turmas e listas", True), (" em código, blocos ou Parsons; competições com placar ICPC.", False)]),
    ("•", [("IA:", True), (" dicas que não entregam a resposta e autoria com validação antes de publicar.",
                           False)]),
    ("•", [("Similaridade de código", True), (" no estilo MOSS, contra cópias.", False)]),
]

# (big number, label) — from the paper's Performance Evaluation.
STATS = [
    ("87,5%", "vereditos corretos (63 de 72)"),
    ("≈5 ms", "custo do isolate por execução"),
    ("0,998", "AUC da detecção de similaridade"),
]

RESULTS_PERF = [
    [("Desempenho medido com benchmarks reproduzíveis:", False)],
]

RESULTS_CLASS = [
    [("Teste em sala", True),
     (" (29/10/2026): 30 alunos do 1º ano do Técnico em Informática integrado do IFMG resolveram uma "
      "lista em Python. SUS médio ", False), ("72,1", True),
     (", acima da referência de 68 (Figura 3). Elogios: dicas da IA e correção imediata; queixa "
      "principal: saída idêntica exigida. Ajustes feitos em até dois dias.", False)],
]

CONCLUSIONS = [
    [("O WhyRunner une execução isolada e concorrente, vereditos de maratona, IA pedagógica e "
      "detecção de cópias, com desempenho medido e reproduzível. ", False),
     ("Ainda não houve avaliação de competições nem com professores", True), (": é o próximo passo.", False)],
]

THANKS = [
    [("À orientadora Suelen Mapa, ao IFMG – Campus Ouro Branco e aos 30 alunos participantes.", False)],
]

FIG1 = "Figura 1 - Arquitetura do WhyRunner"
FIG2 = "Figura 2 - Vazão do judge por número de workers"
FIG3 = "Figura 3 - Nota SUS: alunos por faixa (n = 30)"


# ----------------------------------------------------------- measurement ----


class Fonts:
    def __init__(self, font_dir):
        self.paths = {False: find_font("Poppins-Regular.ttf", font_dir),
                      True: find_font("Poppins-Bold.ttf", font_dir)}
        self.cache = {}

    def width_pt(self, text, size_pt, bold):
        key = (size_pt, bold)
        if key not in self.cache:
            # 10 px per pt keeps rounding error negligible.
            self.cache[key] = ImageFont.truetype(str(self.paths[bold]), size_pt * 10)
        return self.cache[key].getlength(text) / 10

    def lines(self, runs, width_cm, size_pt):
        """Greedy word wrap of a run list, as LibreOffice does; returns the line count."""
        width = width_cm / 2.54 * 72
        words = []  # (word, bold, followed_by_space)
        for text, bold in runs:
            parts = text.split(" ")
            for i, w in enumerate(parts):
                if w:
                    words.append((w, bold, i < len(parts) - 1))
                elif words and i > 0:
                    words[-1] = (words[-1][0], words[-1][1], True)
        n, cur = 1, 0.0
        space = self.width_pt(" ", size_pt, False)
        pending_space = 0.0
        for w, bold, sp in words:
            ww = self.width_pt(w, size_pt, bold)
            if cur and cur + pending_space + ww > width:
                n, cur = n + 1, ww
            else:
                cur += pending_space + ww
            pending_space = space if sp else 0.0
        return n


def find_font(name, font_dir):
    for d in [font_dir] if font_dir else []:
        p = Path(d) / name
        if p.exists():
            return p
    out = subprocess.run(["fc-match", "-f", "%{file}", name.replace(".ttf", "").replace("-", ":style=")],
                         capture_output=True, text=True).stdout
    if "oppins" in out:
        return Path(out)
    sys.exit(f"Poppins font {name} not found: pass --fonts DIR (Google Fonts TTFs)")


# --------------------------------------------------------------- charts ----


def make_charts(out_dir, fonts):
    """The two poster charts, drawn at print size (one column wide) so their
    text prints at 20-22 pt. Same raw data as the thesis figures
    (bench/results/, see bench/charts.py) and the deck's palette."""
    import json

    import matplotlib

    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    from matplotlib import font_manager

    for path in fonts.paths.values():
        font_manager.fontManager.addfont(str(path))
    plt.rcParams.update({"font.family": "Poppins", "font.size": 20, "axes.edgecolor": "#c8c8c8",
                         "axes.labelcolor": "#" + MUTED, "xtick.color": "#" + MUTED,
                         "ytick.color": "#" + MUTED, "axes.spines.top": False, "axes.spines.right": False})
    blue, orange = "#2a78d6", "#eb6834"  # bench/charts.py series 1 and 2
    width_in = COL_W / 2.54
    out_dir.mkdir(parents=True, exist_ok=True)
    res = ROOT / "bench/results"

    d = json.loads((res / "concurrency.json").read_text())
    ns = [1, 2, 4, 8]
    f, ax = plt.subplots(figsize=(width_in, 3.3), dpi=200)
    for burst, color in ((40, blue), (100, orange)):
        ax.plot(ns, [d[f"burst{burst}-n{n}"]["throughput_per_s"] for n in ns], color=color, linewidth=3,
                marker="o", markersize=10, markeredgecolor="white", markeredgewidth=2,
                label=f"rajada de {burst} envios")
    for n in (4, 8):
        r = d[f"burst100-n{n}"]
        ax.annotate(f"{r['speedup_vs_n1']:.1f}×".replace(".", ","), (n, r["throughput_per_s"]),
                    xytext=(0, -34), textcoords="offset points", ha="center", fontsize=22,
                    fontweight="bold", color="#" + INK)
    ax.set_xticks(ns)
    ax.set_xlim(0.6, 8.6)
    ax.set_ylim(0, 3.2)
    ax.set_yticks([0, 1, 2, 3])
    ax.yaxis.grid(True, color="#e2e1dc")
    ax.set_axisbelow(True)
    ax.tick_params(length=0, pad=6)
    ax.set_xlabel("workers")
    ax.set_ylabel("envios / s")
    ax.legend(frameon=False, loc="lower right", fontsize=19)
    f.tight_layout(pad=0.3)
    f.savefig(out_dir / "throughput.png", facecolor="white")
    plt.close(f)

    sv = json.loads((res / "survey_lesson_student.json").read_text())
    bands = sv["sus_bands"]
    f, ax = plt.subplots(figsize=(width_in, 2.8), dpi=200)
    xs = range(len(bands))
    bars = ax.bar(xs, [b["n"] for b in bands], 0.6, color="#" + GREEN)
    for bar in bars:
        ax.annotate(f"{bar.get_height():.0f}", (bar.get_x() + bar.get_width() / 2, bar.get_height()),
                    xytext=(0, 4), textcoords="offset points", ha="center", va="bottom", fontsize=22,
                    fontweight="bold", color="#" + INK)
    ax.set_xticks(list(xs), [f"{b['band'].replace('>=', '≥').replace('-', '–').replace('.', ',')}"
                             f"\nnota {b['grade']}" for b in bands])
    ax.set_ylim(0, max(b["n"] for b in bands) * 1.3)
    ax.set_yticks([])
    ax.spines["left"].set_visible(False)
    ax.tick_params(length=0, pad=6)
    f.tight_layout(pad=0.3)
    f.savefig(out_dir / "sus.png", facecolor="white")
    plt.close(f)
    return {"throughput": out_dir / "throughput.png", "sus": out_dir / "sus.png"}


# ------------------------------------------------------------- pptx edit ----


def shape(slide, n):
    for s in slide.shapes:
        if s.name == f"Google Shape;{n};p13":
            return s
    raise KeyError(n)


def place(shp, x=None, y=None, w=None, h=None):
    if x is not None:
        shp.left = Emu(round(x * CM))
    if y is not None:
        shp.top = Emu(round(y * CM))
    if w is not None:
        shp.width = Emu(round(w * CM))
    if h is not None:
        shp.height = Emu(round(h * CM))


def clone(slide, src):
    el = copy.deepcopy(src._element)
    slide.shapes._spTree.append(el)
    return slide.shapes[-1]


def fill_text(shp, paragraphs, size_pt=None, align=None, color=None):
    """Replace a template text box's paragraphs, keeping its first paragraph's
    pPr and first run's rPr as the style. Bold runs get b="1"; bullet
    paragraphs get a hanging indent and a buChar."""
    txBody = shp.text_frame._txBody
    ps = txBody.findall(qn("a:p"))
    proto_p = ps[0]
    proto_pPr = proto_p.find(qn("a:pPr"))
    proto_rPr = proto_p.find(qn("a:r")).find(qn("a:rPr"))
    for p in ps:
        txBody.remove(p)
    for para in paragraphs:
        bullet = isinstance(para, tuple)
        runs = para[1] if bullet else para
        p = etree.SubElement(txBody, qn("a:p"))
        pPr = copy.deepcopy(proto_pPr)
        p.append(pPr)
        if align:
            pPr.set("algn", align)
        if bullet:
            indent = round(0.9 * CM)
            pPr.set("marL", str(indent))
            pPr.set("indent", str(-indent))
            pPr.set("algn", "l")
            pPr.find(qn("a:spcBef")).find(qn("a:spcPts")).set("val", "600")
            bu = pPr.find(qn("a:buNone"))
            idx = list(pPr).index(bu)
            pPr.remove(bu)
            buClr = etree.Element(qn("a:buClr"))
            etree.SubElement(buClr, qn("a:srgbClr")).set("val", BLUE_DARK)
            buFont = etree.Element(qn("a:buFont"))
            buFont.set("typeface", "Arial")
            buChar = etree.Element(qn("a:buChar"))
            buChar.set("char", "•")
            for i, e in enumerate((buClr, buFont, buChar)):
                pPr.insert(idx + i, e)
        for text, bold in runs:
            r = etree.SubElement(p, qn("a:r"))
            rPr = copy.deepcopy(proto_rPr)
            rPr.set("b", "1" if bold else "0")
            if size_pt:
                rPr.set("sz", str(int(size_pt * 100)))
            if color:
                rPr.find(qn("a:solidFill")).find(qn("a:srgbClr")).set("val", color)
            r.append(rPr)
            t = etree.SubElement(r, qn("a:t"))
            t.text = text
            if text != text.strip():
                t.set("{http://www.w3.org/XML/1998/namespace}space", "preserve")


def text_height(fonts, paragraphs, width_cm, size_pt):
    h = 0.0
    for para in paragraphs:
        bullet = isinstance(para, tuple)
        runs = para[1] if bullet else para
        w = width_cm - (0.9 if bullet else 0)
        h += fonts.lines(runs, w, size_pt) * size_pt * LINE / 72 * 2.54
        if bullet:
            h += 6 / 72 * 2.54
    return h


def add_box(slide, x, y, w, h, fill, line=None, radius=0.12, name=None):
    s = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Emu(round(x * CM)), Emu(round(y * CM)),
                               Emu(round(w * CM)), Emu(round(h * CM)))
    s.adjustments[0] = radius
    s.fill.solid()
    s.fill.fore_color.rgb = RGBColor.from_string(fill)
    if line:
        s.line.color.rgb = RGBColor.from_string(line)
        s.line.width = Pt(2.5)
    else:
        s.line.fill.background()
    # Drop the theme style reference: LibreOffice draws its effectRef shadow
    # even under an empty effectLst. Fill and line are set explicitly above.
    style = s._element.find(qn("p:style"))
    if style is not None:
        s._element.remove(style)
    if name:
        s.name = name
    return s


def box_text(s, lines, anchor=MSO_ANCHOR.MIDDLE, align=PP_ALIGN.CENTER, margin=0.4):
    """lines: [(text, size_pt, bold, color)] — one paragraph each."""
    tf = s.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = anchor
    for side in ("left", "right"):
        setattr(tf, f"margin_{side}", Emu(round(margin * CM)))
    tf.margin_top = tf.margin_bottom = Emu(round(0.15 * CM))
    for i, (text, size, bold, color) in enumerate(lines):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align
        p.line_spacing = 1.0
        r = p.add_run()
        r.text = text
        f = r.font
        f.name = "Poppins"
        f.size = Pt(size)
        f.bold = bold
        f.color.rgb = RGBColor.from_string(color)


def arrow(slide, x1, y1, x2, y2, color=MUTED, both=False):
    c = slide.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, Emu(round(x1 * CM)), Emu(round(y1 * CM)),
                                   Emu(round(x2 * CM)), Emu(round(y2 * CM)))
    c.line.color.rgb = RGBColor.from_string(color)
    c.line.width = Pt(4)
    ln = c.line._get_or_add_ln()
    ends = ("headEnd", "tailEnd") if both else ("tailEnd",)
    for end in ends:
        e = etree.SubElement(ln, qn(f"a:{end}"))
        e.set("type", "triangle")
        e.set("w", "med")
        e.set("len", "med")
    return c


def label(slide, x, y, w, text, size=18, color=MUTED, align=PP_ALIGN.LEFT, bold=False):
    tb = slide.shapes.add_textbox(Emu(round(x * CM)), Emu(round(y * CM)), Emu(round(w * CM)),
                                  Emu(round(1.0 * CM)))
    tf = tb.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    p = tf.paragraphs[0]
    p.alignment = align
    r = p.add_run()
    r.text = text
    r.font.name = "Poppins"
    r.font.size = Pt(size)
    r.font.bold = bold
    r.font.color.rgb = RGBColor.from_string(color)
    return tb


def architecture(slide, x0, y0):
    """Figura 1, as native shapes. Returns its height in cm."""
    W = COL_W
    main_w = 14.6
    side_x = x0 + main_w + 2.2
    side_w = W - main_w - 2.2
    bh = 2.7  # box height
    gap = 1.5  # vertical gap (arrow + label)
    rows = [
        ("Navegador", "aluno · professor", "FFFFFF", BLUE),
        ("Web · Next.js", "Server Actions · Better-Auth", TINT, BLUE),
        ("PostgreSQL", "Drizzle ORM · LISTEN/NOTIFY", "F2F2F2", "A6A6A6"),
        ("Judge · Rust", "conjunto de N workers", GREEN_TINT, GREEN),
        ("Sandbox isolate", "caixa nova por caso de teste · sem rede", GREEN_TINT, GREEN),
    ]
    ys = []
    for i, (name, detail, fill, line) in enumerate(rows):
        y = y0 + i * (bh + gap)
        ys.append(y)
        s = add_box(slide, x0, y, main_w, bh, fill, line, name=f"Arquitetura: {name}")
        box_text(s, [(name, 24, True, INK), (detail, 18, False, MUTED)])
    # vertical arrows with their labels (down = request, up = result)
    labels = [
        ("HTTPS", None),
        ("envio + NOTIFY", "resultado"),
        ("LISTEN", "veredito"),
        ("compila e executa", None),
    ]
    cx = x0 + main_w / 2
    for i, (down, up) in enumerate(labels):
        top, bot = ys[i] + bh, ys[i + 1]
        if up:
            arrow(slide, cx - 1.0, top + 0.1, cx - 1.0, bot - 0.1)
            arrow(slide, cx + 1.0, bot - 0.1, cx + 1.0, top + 0.1)
            label(slide, x0 + 0.2, top + 0.35, cx - 1.4 - x0 - 0.2, down, align=PP_ALIGN.RIGHT)
            label(slide, cx + 1.4, top + 0.35, 6.0, up)
        else:
            arrow(slide, cx, top + 0.1, cx, bot - 0.1, both=(i == 0))
            label(slide, cx + 0.5, top + 0.35, 8.0, down)
    # AI chain beside the web app
    ai_y = ys[1] - 0.9
    ai_h = bh + 1.8
    s = add_box(slide, side_x, ai_y, side_w, ai_h, "FFFFFF", BLUE, name="Arquitetura: cadeia de LLMs")
    box_text(s, [("IA", 24, True, INK), ("Gemini 3.5 Flash", 18, False, MUTED),
                 ("↓ Flash-Lite", 18, False, MUTED), ("↓ Claude Haiku 5.5", 18, False, MUTED)], margin=0.2)
    arrow(slide, x0 + main_w + 0.1, ys[1] + bh / 2, side_x - 0.1, ys[1] + bh / 2, both=True)
    # languages beside the sandbox
    s = add_box(slide, side_x, ys[4] - 0.9, side_w, bh + 1.8, "FFFFFF", GREEN, name="Arquitetura: linguagens")
    box_text(s, [("6 linguagens", 20, True, INK), ("C · C++ · Java", 18, False, MUTED),
                 ("Python · Rust", 18, False, MUTED), ("Portugol", 18, False, MUTED)], margin=0.2)
    arrow(slide, x0 + main_w + 0.1, ys[4] + bh / 2, side_x - 0.1, ys[4] + bh / 2)
    return ys[4] + bh + 0.9 - y0


def stat_cards(slide, x0, y0):
    """One row of big-number cards; returns its height in cm."""
    gap = 0.7
    w = (COL_W - gap * (len(STATS) - 1)) / len(STATS)
    h = 4.8
    for i, (big, text) in enumerate(STATS):
        s = add_box(slide, x0 + i * (w + gap), y0, w, h, TINT, None, radius=0.08, name=f"Destaque: {big}")
        box_text(s, [(big, 48, True, BLUE_DARK), (text, 18, False, INK)], margin=0.35)
    return h


def picture(slide, path, x, y, w):
    from PIL import Image
    with Image.open(path) as im:
        ratio = im.height / im.width
    slide.shapes.add_picture(str(path), Emu(round(x * CM)), Emu(round(y * CM)), Emu(round(w * CM)))
    return w * ratio


# ----------------------------------------------------------------- build ----


def build(build_dir, fonts):
    charts = make_charts(build_dir / "charts", fonts)
    prs = Presentation(str(TEMPLATE))
    slide = prs.slides[0]
    cm_h = lambda size: size * LINE / 72 * 2.54  # one line of text, in cm

    # Header block: title, authors, institution (centered, as in the template).
    title = shape(slide, 85)
    tw = 50.0
    fill_text(title, [[(TITLE, True)]])
    t_lines = fonts.lines([(TITLE, True)], tw, 60)
    place(title, x=(59.4 - tw) / 2, y=10.4, w=tw, h=t_lines * cm_h(60))
    y = 10.4 + t_lines * cm_h(60) + 0.9
    authors = shape(slide, 86)
    runs = []
    for i, (name, sup) in enumerate(AUTHORS):
        runs += [(("" if i == 0 else ", ") + name + sup, False)]
    fill_text(authors, [runs])
    place(authors, x=6.0, y=y, w=47.4, h=cm_h(36))
    y += cm_h(36) + 0.5
    inst = shape(slide, 87)
    fill_text(inst, [INSTITUTION])
    place(inst, x=6.0, y=y, w=47.4, h=cm_h(30))
    y += cm_h(30) + 1.5

    heading_proto = shape(slide, 92)
    body_proto = shape(slide, 90)
    caption_proto = shape(slide, 96)
    used_headings = {92: "Introdução", 94: "Desenvolvimento", 91: "Resultados e Discussões",
                     93: "Conclusões", 97: "Agradecimentos"}
    H_GAP, P_GAP, SECTION_GAP, FIG_GAP = 0.7, 0.6, 1.4, 0.8

    def heading(n, x, y):
        h = shape(slide, n)
        place(h, x=x, y=y, w=COL_W, h=cm_h(36))
        return y + cm_h(36) + H_GAP

    def body(x, y, paragraphs):
        b = clone(slide, body_proto)
        fill_text(b, paragraphs)
        hgt = text_height(fonts, paragraphs, COL_W, BODY_PT)
        place(b, x=x, y=y, w=COL_W, h=hgt)
        return y + hgt

    def caption(x, y, text):
        c = clone(slide, caption_proto)
        fill_text(c, [[(text, True)]])
        place(c, x=x, y=y, w=COL_W, h=cm_h(23.76))
        return y + cm_h(23.76)

    top = y
    # ---- left column
    y = heading(92, LEFT_X, top)
    y = body(LEFT_X, y, INTRO) + SECTION_GAP
    y = heading(94, LEFT_X, y)
    y = body(LEFT_X, y, DEV) + FIG_GAP + 0.9
    y += architecture(slide, LEFT_X, y) + FIG_GAP
    left_end = caption(LEFT_X, y, FIG1)

    # ---- right column
    y = heading(91, RIGHT_X, top)
    y = body(RIGHT_X, y, RESULTS_PERF) + P_GAP
    y += stat_cards(slide, RIGHT_X, y) + FIG_GAP
    y += picture(slide, charts["throughput"], RIGHT_X, y, COL_W) + 0.3
    y = caption(RIGHT_X, y, FIG2) + SECTION_GAP * 0.6
    y = body(RIGHT_X, y, RESULTS_CLASS) + FIG_GAP
    y += picture(slide, charts["sus"], RIGHT_X, y, COL_W) + 0.3
    y = caption(RIGHT_X, y, FIG3) + SECTION_GAP
    y = heading(93, RIGHT_X, y)
    y = body(RIGHT_X, y, CONCLUSIONS) + SECTION_GAP
    y = heading(97, RIGHT_X, y)
    right_end = body(RIGHT_X, y, THANKS)

    # Template-only shapes: lorem body boxes, the sample infographic.
    for n in (88, 89, 90, 99, 100, 95, 96):
        el = shape(slide, n)._element
        el.getparent().remove(el)

    print(f"left column ends at {left_end:.1f} cm, right at {right_end:.1f} cm (limit {BOTTOM} cm)")
    if max(left_end, right_end) > BOTTOM and not ALLOW_OVERFLOW:
        sys.exit("content runs into the footer: shorten the text")
    pptx = build_dir / "banner.pptx"
    prs.save(str(pptx))
    return pptx


def to_pdf(pptx, soffice):
    cmd = soffice.split() + ["--headless", "--convert-to", "pdf", "--outdir", str(pptx.parent), str(pptx)]
    subprocess.run(cmd, check=True)
    pdf = pptx.with_suffix(".pdf")
    if not pdf.exists():
        sys.exit("LibreOffice did not write the PDF")
    return pdf


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--build-dir", type=Path, help="where intermediates go (default: a temp dir, removed)")
    ap.add_argument("--soffice", default="soffice", help="LibreOffice command (default: soffice)")
    ap.add_argument("--fonts", help="directory with Poppins-Regular.ttf and Poppins-Bold.ttf")
    ap.add_argument("--draft", action="store_true", help="render even if a column overflows")
    args = ap.parse_args()
    global ALLOW_OVERFLOW
    ALLOW_OVERFLOW = args.draft
    fonts = Fonts(args.fonts)
    tmp = None
    if args.build_dir:
        build_dir = args.build_dir.resolve()
        build_dir.mkdir(parents=True, exist_ok=True)
    else:
        tmp = tempfile.TemporaryDirectory(prefix="wsi-banner-")
        build_dir = Path(tmp.name)
    try:
        pdf = to_pdf(build(build_dir, fonts), args.soffice)
        shutil.copyfile(pdf, OUT_PDF)
        print("banner ->", OUT_PDF.relative_to(ROOT))
    finally:
        if tmp:
            tmp.cleanup()


if __name__ == "__main__":
    main()
