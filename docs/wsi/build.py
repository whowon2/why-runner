#!/usr/bin/env python3
"""Build the VIII WSI fast-track deck (4 slides, <= 3 min, PT-BR) as a PDF.

    python3 docs/wsi/build.py

Writes docs/wsi/slides.pdf. The HTML and every intermediate file live in a
temporary directory that is removed afterwards, so nothing else lands in the
repo. Needs chromium (headless print-to-pdf); fonts: Carlito (Calibri metric
clone, as in deck v5) and a monospace font.

Style follows docs/presentation/build_v5.py (light theme: ink 1F2328, muted
59636E, green 1A7F37, card F6F8FA, borders D0D7DE, mono kicker and pills).
Numbers come from bench/results/ (summary.json, survey_lesson_student.json),
the same sources as the thesis and deck v5; charts and screenshots are reused
from docs/presentation/.
"""

import html
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
PRES = ROOT / "docs/presentation"
OUT = HERE / "slides.pdf"

Q = json.loads((ROOT / "bench/results/summary.json").read_text("utf-8"))
SV = json.loads((ROOT / "bench/results/survey_lesson_student.json").read_text("utf-8"))

E2E = {k: v["total_ms"] for k, v in Q["e2e_ms_median"].items()}
SPEEDUP8 = Q["concurrency"]["burst100-n8"]["speedup_vs_n1"]
SB = Q["sandbox"]
ISOLATE_MS = sorted(SB[k]["overhead_ms"] for k in ("c_hello", "c_cpu", "cpp_hello", "cpp_cpu", "java_hello",
                                                   "java_cpu"))
SUS = SV["sus"]

# same claims as deck v5 / thesis; fail loudly if the data moved under them
assert max(E2E[k] for k in ("c", "cpp", "python", "rust")) < 400, E2E
assert all(4 <= x <= 7 for x in ISOLATE_MS), ISOLATE_MS
assert SV["responses"] == 30 and SUS["benchmark"] == 68 and SUS["mean"] > SUS["benchmark"]


def br(x, d=1):
    return f"{x:.{d}f}".replace(".", ",")


VERDICTS = [("AC", "#1A7F37"), ("WA", "#CF222E"), ("TLE", "#BC4C00"), ("MLE", "#8250DF"), ("CE", "#9A6700"),
            ("RE", "#BF3989")]

CSS = """
@page { size: 13.333in 7.5in; margin: 0; }
:root { --ink:#1F2328; --muted:#59636E; --green:#1A7F37; --blue:#0969DA; --purple:#8250DF;
        --card:#F6F8FA; --border:#D0D7DE; --tint:#E6F4EA; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { background: #FFFFFF; color: var(--ink); font-family: Carlito, Calibri, sans-serif; }
.mono { font-family: "Courier New", "JetBrainsMono NFM", "DejaVu Sans Mono", monospace; }
.slide { width: 13.333in; height: 7.5in; position: relative; overflow: hidden; page-break-after: always;
         padding: 0.42in 0.6in 0.5in; display: flex; flex-direction: column; }
.slide:last-child { page-break-after: auto; }
.kicker { font-size: 13pt; color: var(--green); font-weight: bold; letter-spacing: .04em; }
h1 { font-size: 34pt; line-height: 1.1; margin-top: .08in; }
.num { position: absolute; right: .6in; bottom: .25in; font-size: 11pt; color: var(--muted); }
.foot { font-size: 13pt; color: var(--muted); }
.pills { display: flex; gap: .3in; justify-content: center; }
.pill { border: 2px solid var(--green); background: var(--card); color: var(--green); border-radius: 99px;
        padding: .1in .3in; font-size: 17pt; font-weight: bold; white-space: nowrap; }
.shot { border: 1.5px solid var(--border); border-radius: 8px; box-shadow: 0 4px 16px rgba(31,35,40,.08);
        display: block; max-width: 100%; }
.card { background: var(--card); border: 2px solid var(--border); border-radius: 10px; text-align: center;
        display: flex; flex-direction: column; justify-content: center; }
.card b { font-size: 21pt; } .card span { font-size: 14pt; color: var(--muted); margin-top: .04in; }

/* 1 · cover */
.cover { justify-content: center; padding-left: .9in; }
.cover .cmd { font-size: 16pt; color: var(--green); font-weight: bold; }
.cover .name { font-size: 70pt; font-weight: bold; line-height: 1; margin-top: .12in; }
.cover .sub { font-size: 23pt; color: var(--muted); width: 7.3in; margin-top: .18in; line-height: 1.2; }
.cover .who { font-size: 16pt; margin-top: .55in; line-height: 1.45; }
.grid { position: absolute; right: .9in; top: 1.55in; display: grid; grid-template-columns: 1.7in 1.7in;
        gap: .3in .25in; }
.vd { height: 1.15in; border: 2.5px solid; border-radius: 12px; background: var(--card); display: flex;
      align-items: center; justify-content: center; font-size: 30pt; font-weight: bold; }
.event { position: absolute; left: .9in; bottom: .45in; font-size: 13pt; color: var(--muted); }

/* 2 · problem + solution */
.ps { display: flex; flex-direction: column; justify-content: space-evenly; flex: 1; margin-top: .1in; }
.before { display: flex; align-items: center; gap: .3in; font-size: 21pt; }
.lbl { font-size: 12pt; color: var(--muted); font-weight: bold; margin-bottom: .1in; }
.bad { border: 2.5px solid #CF222E; color: #CF222E; background: var(--card); border-radius: 10px;
       font-size: 26pt; font-weight: bold; padding: .08in .35in; }
.before .lbl { margin: 0; }
.after .lbl { color: var(--green); }
.row { display: flex; gap: .4in; align-items: center; }
.stack { display: flex; flex-direction: column; gap: .3in; flex: 1; }
.stack .pill { text-align: center; font-size: 15pt; white-space: normal; padding: .12in .15in; border-radius: 14px; }

/* 3 · how it works */
.how { flex: 1; display: flex; flex-direction: column; justify-content: space-evenly; }
.flow { display: flex; align-items: stretch; gap: 0; }
.flow .card { flex: 1; height: 1.35in; }
.arrow { width: .55in; display: flex; align-items: center; justify-content: center; color: var(--green);
         font-size: 26pt; font-weight: bold; }
.ai { width: 3.2in; height: 1.0in; margin: .1in auto 0; border-color: var(--purple); }
.down { text-align: center; color: var(--purple); font-size: 24pt; font-weight: bold; line-height: 1;
        margin-top: .1in; }

/* 4 · results */
.res { display: grid; grid-template-columns: 4.1in 1fr; gap: .5in; margin-top: .45in; flex: 1; }
.stat { border-left: 5px solid var(--green); padding: .02in 0 .02in .22in; margin-bottom: .42in; }
.stat .big { font-size: 40pt; font-weight: bold; line-height: 1; color: var(--green); }
.stat .what { font-size: 16pt; margin-top: .05in; line-height: 1.2; }
.sus .head { display: flex; align-items: baseline; gap: .25in; }
.sus .score { font-size: 54pt; font-weight: bold; color: var(--green); line-height: 1; }
.sus .ref { font-size: 22pt; color: var(--muted); }
.sus .who { font-size: 16pt; margin: .06in 0 .14in; }
.sus img { width: 100%; }
.lbl2 { font-size: 12pt; color: var(--muted); font-weight: bold; margin-bottom: .14in; }
"""


def slide(n, kicker, title, body):
    return (f'<section class="slide"><div class="kicker mono">{kicker}</div><h1>{html.escape(title)}</h1>'
            f'{body}<div class="num mono">{n} / 4</div></section>')


def cover():
    grid = "".join(f'<div class="vd mono" style="border-color:{c};color:{c}">{v}</div>' for v, c in VERDICTS)
    return f"""<section class="slide cover">
  <div class="cmd mono">$ whyrunner --wsi</div>
  <div class="name">WhyRunner</div>
  <div class="sub">Juiz online para programação competitiva e para o ensino de programação</div>
  <div class="who"><b>Juan Israel dos Anjos</b><br>Orientadora: Suellen Mapa<br>
    Bacharelado em Sistemas de Informação · IFMG Campus Ouro Branco</div>
  <div class="grid">{grid}</div>
  <div class="event mono">VIII WSI · fast-track de TCC · 03/12/2026</div>
</section>"""


def problem(img):
    body = f"""<div class="ps">
  <div class="before"><span class="lbl mono">JUÍZES ONLINE COMUNS</span>
    <span class="bad mono">WRONG ANSWER</span><span>e nada mais: onde errei? como sigo?</span></div>
  <div class="after"><div class="lbl mono">NO WHYRUNNER</div>
    <div class="row"><img class="shot" style="height:3.4in" src="{img}">
      <div class="stack"><div class="pill mono">o caso de teste que falhou</div>
        <div class="pill mono">dica de IA no “Explicar”</div><div class="pill mono">6 linguagens, Portugol incluso</div></div>
    </div></div>
</div>"""
    return slide(2, "O PROBLEMA E A SOLUÇÃO", "O aluno vê por que errou, não só que errou", body)


def how():
    boxes = [("Navegador", "aluno e professor", "var(--border)"), ("Next.js", "site e Server Actions",
             "var(--border)"), ("PostgreSQL", "LISTEN / NOTIFY", "var(--blue)"), ("Judge", "Rust · workers",
             "var(--border)"), ("isolate", "sem rede · limites", "var(--green)")]
    cells = []
    for i, (a, b, col) in enumerate(boxes):
        if i:
            cells.append('<div class="arrow">→</div>')
        cells.append(f'<div class="card" style="border-color:{col}"><b>{a}</b><span>{b}</span></div>')
    body = f"""<div class="how"><div><div class="flow">{''.join(cells)}</div>
<div style="display:grid;grid-template-columns:repeat(9,1fr)"><div style="grid-column:2/5">
  <div class="down">↓</div>
  <div class="card ai"><b>IA</b><span>explica o erro, sem dar a resposta</span></div>
</div></div></div>
<div class="feat"><div class="lbl2 mono" style="text-align:center">PARA O PROFESSOR</div>
  <div class="pills"><div class="pill mono">aulas e listas com prazo</div>
  <div class="pill mono">torneios com placar</div><div class="pill mono">detecção de plágio</div></div></div></div>"""
    return slide(3, "COMO FUNCIONA", "O site grava o envio; o judge executa numa caixa sem rede", body)


def results(chart):
    ms = ", ".join(f"{n} {br(E2E[k] / 1000, 2)} s" for k, n in (("c", "C"), ("python", "Python")))
    body = f"""<div class="res">
  <div>
    <div class="lbl2 mono">BENCHMARKS REPRODUZÍVEIS</div>
    <div class="stat"><div class="big">&lt; 0,4 s</div>
      <div class="what">do envio ao veredito, sem fila<br><span class="foot">({ms}; Java e Portugol mais lentos)</span></div></div>
    <div class="stat"><div class="big">{br(SPEEDUP8)}×</div>
      <div class="what">mais vazão com 8 workers<br><span class="foot">rajada de 100 envios, 6 linguagens</span></div></div>
    <div class="stat"><div class="big">≈ 5 ms</div>
      <div class="what">custo do isolate por execução</div></div>
  </div>
  <div class="sus">
    <div class="lbl2 mono">TESTE EM SALA · 29/10/2026</div>
    <div class="head"><div class="score">SUS {br(SUS['mean'])}</div><div class="ref">acima da referência de {SUS['benchmark']}</div></div>
    <div class="who">{SV['responses']} alunos do 1º ano do técnico integrado, uma lista de exercícios</div>
    <img src="{chart}">
    <div class="foot" style="margin-top:.1in">Ainda não avaliado: torneios e uso por professores.</div>
  </div>
</div>"""
    return slide(4, "RESULTADOS", "Rápido no judge e aprovado pela turma", body)


def narrow_shot(src, dst):
    """The submission card is ~3000 px wide with empty middle: drop the "Submissões (6)" header and splice
    its left part (code, "Resposta errada no teste 2") to its right part (verdict, "Explicar") so the
    text reads at slide size."""
    from PIL import Image
    im = Image.open(src).convert("RGB")
    top, cut_l, cut_r = 150, 1180, 2520
    left = im.crop((0, top, cut_l, im.height))
    right = im.crop((cut_r, top, im.width, im.height))
    out = Image.new("RGB", (left.width + right.width, left.height), "white")
    out.paste(left, (0, 0))
    out.paste(right, (left.width, 0))
    out.save(dst)


def main():
    chromium = shutil.which("chromium") or shutil.which("chromium-browser") or shutil.which("google-chrome")
    if not chromium:
        sys.exit("chromium not found")
    with tempfile.TemporaryDirectory(prefix="wsi-") as tmp:
        tmp = Path(tmp)
        shutil.copy(PRES / "charts/survey_sus_bands.png", tmp / "sus.png")
        narrow_shot(PRES / "screenshots/submissoes-explicar.png", tmp / "explicar.png")
        page = (f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>WhyRunner · VIII WSI'
                f'</title><style>{CSS}</style></head><body>{cover()}{problem("explicar.png")}{how()}'
                f'{results("sus.png")}</body></html>')
        (tmp / "slides.html").write_text(page, "utf-8")
        pdf = tmp / "slides.pdf"
        subprocess.run([chromium, "--headless", "--disable-gpu", "--no-sandbox", "--no-pdf-header-footer",
                        f"--user-data-dir={tmp / 'profile'}", f"--print-to-pdf={pdf}",
                        (tmp / "slides.html").as_uri()], check=True, capture_output=True)
        shutil.copy(pdf, OUT)
    print(f"wrote {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
