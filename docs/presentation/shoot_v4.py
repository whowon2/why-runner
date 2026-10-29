#!/usr/bin/env python3
"""Screenshots for deck v4, from the local dev server seeded by seed_v4.py.
Headless Chromium (system /usr/bin/chromium), 1600x900 viewport, 2x scale,
light mode (deck v5 is light; v4 shot dark), Portuguese locale, default theme. Logs in with the local
test accounts listed in web/CLAUDE.md.

    bench/.venv/bin/python docs/presentation/shoot_v4.py            # all shots
    bench/.venv/bin/python docs/presentation/shoot_v4.py home gradebook
    bench/.venv/bin/python docs/presentation/shoot_v4.py --explore teacher /br/home

The shots under "deck v3's screenshots" use v3's demo data (prof@demo.local's
class and problems, rafa@demo.local as an unsubmitted student), whose password
is not recorded: copy the teacher's password hash onto those two accounts,
run with DEMO_PASSWORD=teacherteacher, then put the old hash back. `parsons`
needs aula-5-lacos-demo's due_date in the future (the editor locks after it)
and `review` needs it in the past (review opens after it); `ai_review` makes a
real AI call. `survey_results` needs teacher@email.com in SURVEY_ADMIN_EMAILS
(web/.env.local) while it runs.
"""

import os
import re
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
SHOTS = Path(__file__).parent / "screenshots"
PORT = re.search(r"DEV_PORT=(\d+)", (ROOT / "web/.env.local").read_text()).group(1)
BASE = f"http://localhost:{PORT}"
ACCOUNTS = {"teacher": ("teacher@email.com", "teacherteacher"), "student": ("user@email.com", "useruser"),
            # v3's demo data (blocks/Parsons lesson, Marina Costa's problems) belongs to these demo
            # accounts; their password is not recorded, so give them a known one first (see main docstring).
            "prof": ("prof@demo.local", os.environ.get("DEMO_PASSWORD", "")),
            "rafa": ("rafa@demo.local", os.environ.get("DEMO_PASSWORD", ""))}
SCRATCH = Path(os.environ.get("SHOT_SCRATCH", "/tmp"))
# The app defaults to dark (next-themes, defaultTheme="dark"); its stored choice wins.
LIGHT = "localStorage.setItem('theme', 'light')"


def login(ctx, role):
    page = ctx.new_page()
    page.goto(f"{BASE}/br/auth/signin")
    page.wait_for_load_state("networkidle")
    email, password = ACCOUNTS[role]
    page.locator('input[type="email"]').first.fill(email)
    page.locator('input[type="password"]').first.fill(password)
    page.locator('input[type="password"]').first.press("Enter")
    page.wait_for_url(re.compile(r"/(home|problems)"), timeout=30000)
    return page


def tidy(page):
    page.evaluate("document.querySelectorAll('nextjs-portal').forEach(e => e.remove())")
    page.wait_for_timeout(400)


def go(page, path):
    page.goto(BASE + path)
    page.wait_for_load_state("networkidle")
    tidy(page)


def save_box(page, name, top, bottom=None, pad=16, x=None, width=None):
    """Full-page shot clipped from element `top` to element `bottom` (locators)."""
    tidy(page)
    a = top.bounding_box()
    b = (bottom or top).bounding_box()
    sy = page.evaluate("window.scrollY")
    y0 = a["y"] + sy - pad
    y1 = b["y"] + b["height"] + sy + pad
    x0 = x if x is not None else min(a["x"], b["x"]) - pad
    w = width if width is not None else max(a["x"] + a["width"], b["x"] + b["width"]) - x0 + pad
    page.screenshot(path=SHOTS / f"{name}.png", full_page=True,
                    clip={"x": x0, "y": max(0, y0), "width": w, "height": y1 - max(0, y0)})
    print("saved", name)


def save(page, name, clip=None, full=False):
    tidy(page)
    page.screenshot(path=SHOTS / f"{name}.png", clip=clip, full_page=full)
    print("saved", name)


# ------------------------------------------------------------------ shots --
# each: (role, function(page))
SHOTS_DEF = {}

HIDE_DOCK = """for (const a of document.querySelectorAll('a[href$="/home"]')) {
  let el = a;
  while (el && el !== document.body) {
    const pos = getComputedStyle(el).position;
    if (pos === 'fixed' || pos === 'sticky') { el.style.display = 'none'; break; }
    el = el.parentElement;
  }
}"""
CONTENT = {"x": 270, "y": 30, "width": 1060, "height": 780}


def shot(role):
    def deco(f):
        SHOTS_DEF[f.__name__] = (role, f)
        return f
    return deco


def nodock(p):
    p.evaluate(HIDE_DOCK)


def save_el(page, name, el, pad=0):
    """Just the element (a dialog or popover), without the dimmed page around it."""
    b = el.bounding_box()
    save(page, name, clip={"x": b["x"] - pad, "y": b["y"] - pad, "width": b["width"] + 2 * pad,
                           "height": b["height"] + 2 * pad})


@shot("student")
def home(p):
    go(p, "/br/home")
    nodock(p)
    save(p, "v4-home", clip={"x": 100, "y": 20, "width": 1400, "height": 640})


@shot("student")
def palette(p):
    go(p, "/br/home")
    p.keyboard.press("Control+k")
    p.wait_for_timeout(700)
    p.keyboard.type("soma")
    p.wait_for_timeout(1200)
    save_el(p, "v4-command-palette", p.get_by_role("dialog").first)


@shot("student")
def palette_hint(p):
    go(p, "/br/problems")
    p.locator("button[aria-label*='Buscar'], button:has-text('Buscar')").first.hover()
    p.wait_for_timeout(900)
    save(p, "v4-command-palette-hint", clip={"x": 500, "y": 640, "width": 600, "height": 200})


@shot("student")
def notifications(p):
    go(p, "/br/home")
    p.locator("button:has(svg.lucide-bell), button[aria-label*='otifica']").first.click()
    p.wait_for_timeout(1200)
    save_el(p, "v4-notifications", p.locator("[data-radix-popper-content-wrapper] > *").first)


@shot("student")
def verdicts(p):
    go(p, "/br/contests/maratona-demo-v4")
    p.locator("button", has_text=re.compile(r"^\s*A\s*$")).first.click()
    p.wait_for_timeout(2500)
    nodock(p)
    head = p.get_by_text(re.compile(r"^Submissões \(")).first
    rows = p.locator("text=/\\d\\d:\\d\\d:\\d\\d/")
    card = head.evaluate("""e => { let el = e;
        while (el && el.getBoundingClientRect().width < 450) el = el.parentElement;
        const r = el.getBoundingClientRect(); return {x: r.x, w: r.width}; }""")
    save_box(p, "v4-verdicts-contest", head, rows.last, x=card["x"] - 8, width=card["w"] + 16)


@shot("student")
def survey_banner(p):
    go(p, "/br/contests/maratona-demo-v4")
    nodock(p)
    save(p, "v4-survey-banner", clip={"x": 200, "y": 0, "width": 1200, "height": 120})


@shot("student")
def not_found(p):
    go(p, "/br/pagina-que-nao-existe")
    nodock(p)
    save(p, "v4-404", clip={"x": 500, "y": 20, "width": 600, "height": 540})


@shot("student")
def profile(p):
    go(p, "/br/user/uai")
    nodock(p)
    save(p, "v4-profile", clip={"x": 330, "y": 20, "width": 940, "height": 520})


@shot("student")
def settings(p):
    go(p, "/br/settings")
    nodock(p)
    save(p, "v4-settings-theme", clip={"x": 280, "y": 20, "width": 1040, "height": 420})


@shot("teacher")
def standings(p):
    go(p, "/br/contests/maratona-demo-v4")
    p.locator("button", has_text="Placar").first.click()
    p.wait_for_timeout(2000)
    nodock(p)
    t = p.locator("table").first
    save_box(p, "v4-standings", t, p.get_by_text(re.compile("Penalidade = ")).first)


@shot("teacher")
def contest_settings(p):
    go(p, "/br/contests/maratona-demo-v4")
    p.locator("button", has_text="Configura").first.click()
    p.wait_for_timeout(2000)
    nodock(p)
    save_box(p, "v4-contest-settings", p.get_by_text("Configurações", exact=True).last,
             p.get_by_role("button", name="Salvar").first, pad=24)


@shot("teacher")
def contest_manage(p):
    go(p, "/br/contests/maratona-demo-v4")
    p.locator("button", has_text="Gerenciar").first.click()
    p.wait_for_timeout(2000)
    nodock(p)
    save_box(p, "v4-contest-join-requests", p.get_by_text("Gerenciamento de Pessoas").first,
             p.get_by_text("Pedro Alves").last, pad=40, x=200, width=1200)


@shot("teacher")
def similarity_contest(p):
    go(p, "/br/contests/maratona-demo-v4/similarity")
    nodock(p)
    save(p, "v4-similarity-pairs", clip={"x": 270, "y": 40, "width": 1060, "height": 380})
    p.locator("table tbody tr").first.click()
    p.wait_for_timeout(2000)
    nodock(p)
    save_box(p, "v4-similarity-side-by-side", p.get_by_text(re.compile("regi(ão|ões) coincident")).first,
             p.locator("pre").last, pad=20, x=270, width=1060)


@shot("teacher")
def similarity_exercise(p):
    go(p, "/br/classes/algoritmos-demo-v4/lessons/aula-1-lacos-demo-v4/exercises/aula-1-lacos-demo-v4-demo-101/similarity")
    p.wait_for_timeout(1000)
    nodock(p)
    save(p, "v4-similarity-exercise", clip={"x": 270, "y": 40, "width": 1060, "height": 450})


@shot("teacher")
def gradebook(p):
    go(p, "/br/classes/algoritmos-demo-v4/gradebook")
    nodock(p)
    save(p, "v4-gradebook", clip={"x": 270, "y": 30, "width": 1060, "height": 450})


@shot("teacher")
def class_page(p):
    go(p, "/br/classes/algoritmos-demo-v4")
    nodock(p)
    save_box(p, "v4-class-lessons", p.get_by_text("Aula 1 — Laços").first,
             p.get_by_text("Prazo 24/10/2026").first, pad=40, x=270, width=1060)


@shot("teacher")
def problem_edit(p):
    go(p, "/br/problems/um-divisor-demo-v4")
    p.locator("button", has_text="Editar").first.click()
    p.wait_for_timeout(1500)
    nodock(p)
    title = p.get_by_text("Comparação da saída").first
    title.scroll_into_view_if_needed()
    p.wait_for_timeout(500)
    save_box(p, "v4-compare-checker", title, p.get_by_text(re.compile("nunca veem")).first, pad=24)


@shot("teacher")
def problem_import(p):
    go(p, "/br/problems")
    p.get_by_role("button", name=re.compile("Importar")).first.click()
    p.wait_for_timeout(1200)
    save_el(p, "v4-problem-import", p.get_by_role("dialog").first)


@shot("teacher")
def survey_preview(p):
    go(p, "/br/surveys/preview")
    nodock(p)
    save(p, "v4-survey-tcle", clip=CONTENT)
    p.get_by_text("Aluno · competição").first.click()
    p.wait_for_timeout(1200)
    nodock(p)
    save_box(p, "v4-survey-sus", p.get_by_text("Usabilidade geral").first,
             p.get_by_text(re.compile("^3\\. ")).first, pad=24)


@shot("teacher")
def survey_results(p):
    go(p, "/br/surveys/results")
    p.wait_for_timeout(1000)
    nodock(p)
    save(p, "v4-survey-results", clip={"x": 270, "y": 30, "width": 1060, "height": 480})


# ---- deck v3's screenshots, re-shot for the light deck (v5) on v3's demo data --


@shot("prof")
def bank(p):
    go(p, "/br/problems")
    nodock(p)
    p.get_by_placeholder(re.compile("Buscar|Pesquisar")).first.fill("DEMO")
    p.wait_for_timeout(1200)
    p.locator("button", has_text="Tags").first.click()
    p.wait_for_timeout(800)
    save(p, "lista-problemas-filtros", clip={"x": 270, "y": 30, "width": 1060, "height": 520})


@shot("teacher")
def class_code(p):
    go(p, "/br/classes/algoritmos-demo-v4")
    nodock(p)
    save_box(p, "turma-codigo", p.get_by_text("Algoritmos I — Turma demo").first,
             p.get_by_text(re.compile("Código da turma")).first, pad=24, x=270, width=1120)


def edit_problem(p, slug):
    go(p, f"/br/problems/{slug}")
    p.locator("button", has_text="Editar").first.click()
    p.wait_for_timeout(1500)
    nodock(p)


@shot("prof")
def narrative_tags(p):
    edit_problem(p, "numero-primo-demo")
    top = p.get_by_text("Narrativa", exact=True).first
    top.scroll_into_view_if_needed()
    save_box(p, "ia-narrativa-tags", top, p.get_by_text(re.compile("Sugerir tags")).first, pad=70, x=200,
             width=1200)


@shot("prof")
def ai_review(p):
    edit_problem(p, "numero-primo-demo")
    head = p.get_by_text("Revisar com IA").first
    head.scroll_into_view_if_needed()
    p.locator("button", has_text="Revisar com IA").first.click()
    p.get_by_text(re.compile("Adicionar caso de teste")).first.wait_for(timeout=90000)
    p.wait_for_timeout(800)
    save_box(p, "ia-revisao-casos-borda", head, p.get_by_text(re.compile("Adicionar caso de teste")).nth(1),
             pad=24, x=200, width=1200)


@shot("prof")
def validate(p):
    edit_problem(p, "soma-1-ate-n-demo")
    head = p.get_by_text("Validar antes de publicar").first
    head.scroll_into_view_if_needed()
    box = head.locator("xpath=ancestor::*[.//button[normalize-space()='Validar']][1]")
    box.locator("button[role=combobox]").first.click()
    p.get_by_role("option", name="python", exact=True).first.click()
    editor = box.locator(".monaco-editor, textarea").first
    editor.click()
    p.keyboard.press("Control+a")
    p.keyboard.insert_text("n = int(input())\nprint(n * (n + 1) // 2)\n")
    box.get_by_role("button", name="Validar").first.click()
    p.get_by_text(re.compile("Validação aprovada")).first.wait_for(timeout=60000)
    p.wait_for_timeout(500)
    save_box(p, "validacao-aprovada", head, p.get_by_text(re.compile("Validação aprovada")).first, pad=24,
             x=200, width=1200)


@shot("prof")
def preview(p):
    edit_problem(p, "numero-primo-demo")
    p.get_by_role("tab", name=re.compile("Pré-visualiza|Visualiza")).first.click()
    p.wait_for_timeout(1500)
    nodock(p)
    title = p.get_by_text("Número primo", exact=True).last
    title.scroll_into_view_if_needed()
    p.wait_for_timeout(500)
    b = title.bounding_box()
    sy = p.evaluate("window.scrollY")
    p.screenshot(path=SHOTS / "previsualizacao.png", full_page=True,
                 clip={"x": 230, "y": b["y"] + sy - 40, "width": 1140, "height": 560})
    print("saved previsualizacao")


@shot("prof")
def contest_problems(p):
    go(p, "/br/contests/torneio-relampago-demo")
    p.locator("button", has_text="Configura").first.click()
    p.wait_for_timeout(1500)
    nodock(p)
    head = p.get_by_text("Problemas", exact=True).last
    head.scroll_into_view_if_needed()
    p.get_by_role("combobox").filter(has_text="Problema").first.click()
    p.keyboard.type("DEMO-10")
    p.wait_for_timeout(1500)
    save_box(p, "torneio-busca-codigo", head, p.get_by_text(re.compile("Número primo")).last, pad=24, x=200,
             width=1200)


@shot("prof")
def editor(p):
    go(p, "/br/problems/soma-1-ate-n-demo")
    p.locator("button", has_text="Enviar").first.click()
    p.wait_for_timeout(2000)
    nodock(p)
    p.get_by_role("combobox").filter(has_text=re.compile("linguagem")).first.click()
    p.get_by_role("option", name="python", exact=True).first.click()
    p.wait_for_timeout(800)
    p.locator(".monaco-editor").first.click()
    p.keyboard.press("Control+a")
    p.keyboard.insert_text("n = int(input())\ntotal = 0\nfor i in range(1, n + 1):\n    total += i\nprint(total)\n")
    p.wait_for_timeout(2500)
    save_box(p, "editor-autosave", p.get_by_role("combobox").first, p.locator(".monaco-editor").first, pad=24)


@shot("student")
def contest_failed_case(p):
    go(p, "/br/contests/maratona-demo-v4")
    p.locator("button", has_text=re.compile(r"^\s*A\s*$")).first.click()
    p.wait_for_timeout(2500)
    nodock(p)
    p.get_by_text("Resposta errada").first.click()
    p.wait_for_timeout(1500)
    head = p.get_by_text(re.compile(r"^Submissões \(")).first
    save_box(p, "submissoes-explicar", head, p.get_by_role("button", name=re.compile("Explicar")).first, pad=16)


@shot("rafa")
def parsons(p):
    go(p, "/br/classes/algoritmos-1-demo/lessons/aula-5-lacos-demo")
    p.get_by_text("Contagem de vogais").first.click()
    p.wait_for_timeout(3000)
    nodock(p)
    save_box(p, "formato-parsons", p.get_by_text("Contagem de vogais").first,
             p.get_by_text("s = input()").first, pad=40, x=150, width=1300)


@shot("prof")
def constraints(p):
    go(p, "/br/classes/algoritmos-1-demo/lessons/aula-5-lacos-demo")
    p.locator("button", has_text="Restrições").first.click()
    p.wait_for_timeout(1500)
    d = p.get_by_role("dialog").first
    b = d.bounding_box()
    save(p, "solution-constraints", clip={"x": b["x"] - 8, "y": b["y"] - 8, "width": b["width"] + 16,
                                          "height": b["height"] + 16})


@shot("prof")
def review(p):
    go(p, "/br/classes/algoritmos-1-demo/lessons/aula-5-lacos-demo")
    p.locator("button, a", has_text="Revisar respostas").first.click()
    p.wait_for_timeout(2500)
    p.get_by_text("Lucas Andrade").first.click()
    p.wait_for_timeout(2500)
    nodock(p)
    save_box(p, "revisao-professor", p.get_by_text("Lucas Andrade").first, p.get_by_text("Salvar feedback").first,
             pad=20, x=270, width=1060)
    # blocks answer: Lucas's exercise 2, blocks plus the Portugol they generate
    second = p.get_by_text(re.compile("^2\\. Multiplica")).first
    second.scroll_into_view_if_needed()
    p.wait_for_timeout(4000)
    save_box(p, "formato-blocos", second, p.get_by_text("Salvar feedback").nth(1), pad=20, x=270, width=1060)


def explore(role, *paths):
    """Screenshots each path at 1x into $SHOT_SCRATCH and lists its buttons and links."""
    with sync_playwright() as pw:
        b = pw.chromium.launch(executable_path="/usr/bin/chromium")
        ctx = b.new_context(viewport={"width": 1600, "height": 900}, device_scale_factor=1, color_scheme="light",
                            locale="pt-BR")
        ctx.add_init_script(LIGHT)
        p = login(ctx, role)
        for n, path in enumerate(paths):
            go(p, path)
            p.wait_for_timeout(1500)
            out = SCRATCH / f"explore-{n}.png"
            p.screenshot(path=out)
            print("==", path, out)
            for el in p.locator("main button, main a[href], main [role=tab], header button").all()[:60]:
                try:
                    t = (el.inner_text(timeout=200) or el.get_attribute("aria-label") or "").strip()
                    href = el.get_attribute("href") or ""
                    if t or href:
                        print(f"  [{el.evaluate('e => e.tagName')}] {t[:50]} {href}")
                except Exception:
                    pass
        b.close()


def main(names):
    SHOTS.mkdir(exist_ok=True)
    with sync_playwright() as pw:
        b = pw.chromium.launch(executable_path="/usr/bin/chromium")
        pages = {}
        for name in names or SHOTS_DEF:
            role, f = SHOTS_DEF[name]
            if role not in pages:
                ctx = b.new_context(viewport={"width": 1600, "height": 900}, device_scale_factor=2,
                                    color_scheme="light", locale="pt-BR")
                ctx.add_init_script(LIGHT)
                pages[role] = login(ctx, role)
            try:
                f(pages[role])
            except Exception as e:  # keep going; report at the end
                print("FAILED", name, e)
        b.close()


if __name__ == "__main__":
    if sys.argv[1:2] == ["--explore"]:
        explore(sys.argv[2], *sys.argv[3:])
    else:
        main(sys.argv[1:])
