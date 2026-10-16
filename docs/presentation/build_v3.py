#!/usr/bin/env python3
"""Build the TCC II partial-presentation deck v3 from v2.

    python3 docs/presentation/build_v3.py

Reads  "WhyRunner — Apresentação Parcial TCC II v2.pptx" (repo root, untouched)
Writes "WhyRunner — Apresentação Parcial TCC II v3.pptx" (repo root)

v2 slides are edited in place (date, AI chain, validation split, cronograma,
kickers) and new screenshot slides are generated in v2's own XML idiom, with
images from docs/presentation/screenshots/. See
openspec/changes/improve-presentation-deck/ for the why.
"""

import re
import shutil
import tempfile
import zipfile
from pathlib import Path
from xml.sax.saxutils import escape

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "WhyRunner — Apresentação Parcial TCC II v2.pptx"
OUT = ROOT / "WhyRunner — Apresentação Parcial TCC II v3.pptx"
SHOTS = Path(__file__).resolve().parent / "screenshots"

EMU = 914400
NS_REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
CT_SLIDE = "application/vnd.openxmlformats-officedocument.presentationml.slide+xml"
CT_NOTES = "application/vnd.openxmlformats-officedocument.presentationml.notesSlide+xml"


def emu(v):
    return int(round(v * EMU))


# ---------------------------------------------------------------- shapes ----


class Shapes:
    """Emits <p:sp>/<p:pic> in the same idiom as the v2 deck (pptxgenjs)."""

    def __init__(self, start_id=20):
        self.next_id = start_id
        self.images = []  # (rId, media file name)
        self.xml = []

    def _id(self):
        self.next_id += 1
        return self.next_id

    def _xfrm(self, x, y, w, h):
        return (f'<a:xfrm><a:off x="{emu(x)}" y="{emu(y)}"/>'
                f'<a:ext cx="{emu(w)}" cy="{emu(h)}"/></a:xfrm>')

    @staticmethod
    def _fill(color):
        if color is None:
            return "<a:noFill/>"
        tag = "srgbClr" if re.fullmatch(r"[0-9A-F]{6}", color) else "schemeClr"
        return f'<a:solidFill><a:{tag} val="{color}"/></a:solidFill>'

    def box(self, x, y, w, h, fill="tx2", line="accent6", geom="roundRect",
            dash=None, adj=2083, name=None):
        sid = self._id()
        av = f'<a:gd name="adj" fmla="val {adj}"/>' if geom == "roundRect" else ""
        ln = ("<a:ln/>" if line is None else
              f'<a:ln w="9525">{self._fill(line)}'
              f'<a:prstDash val="{dash or "solid"}"/></a:ln>')
        self.xml.append(
            f'<p:sp><p:nvSpPr><p:cNvPr id="{sid}" name="{name or f"Shape {sid}"}"/>'
            f'<p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr>{self._xfrm(x, y, w, h)}'
            f'<a:prstGeom prst="{geom}"><a:avLst>{av}</a:avLst></a:prstGeom>'
            f'{self._fill(fill)}{ln}</p:spPr></p:sp>')

    def arrow(self, x1, y1, x2, y2, color="accent1", dash=None):
        sid = self._id()
        flip = (' flipH="1"' if x2 < x1 else "") + (' flipV="1"' if y2 < y1 else "")
        x, y = min(x1, x2), min(y1, y2)
        w, h = abs(x2 - x1), abs(y2 - y1)
        self.xml.append(
            f'<p:cxnSp><p:nvCxnSpPr><p:cNvPr id="{sid}" name="Arrow {sid}"/>'
            f'<p:cNvCxnSpPr/><p:nvPr/></p:nvCxnSpPr><p:spPr>'
            f'<a:xfrm{flip}><a:off x="{emu(x)}" y="{emu(y)}"/>'
            f'<a:ext cx="{emu(w)}" cy="{emu(h)}"/></a:xfrm>'
            f'<a:prstGeom prst="line"><a:avLst/></a:prstGeom>'
            f'<a:ln w="19050">{self._fill(color)}'
            f'<a:prstDash val="{dash or "solid"}"/>'
            f'<a:tailEnd type="triangle" w="med" len="med"/></a:ln>'
            f'</p:spPr></p:cxnSp>')

    def text(self, x, y, w, h, paras, size=14, color="bg1", bold=False,
             mono=False, align=None, anchor="t", italic=False, space_after=0):
        """paras: str | list of paragraphs; a paragraph is str or list of
        runs; a run is str or (text, {size,color,bold,mono,italic})."""
        sid = self._id()
        if isinstance(paras, str):
            paras = [paras]
        ps = []
        for para in paras:
            runs = [para] if isinstance(para, (str, tuple)) else para
            rx = []
            for run in runs:
                t, o = (run, {}) if isinstance(run, str) else run
                sz = o.get("size", size)
                col = o.get("color", color)
                b = ' b="1"' if o.get("bold", bold) else ""
                it = ' i="1"' if o.get("italic", italic) else ""
                font = ""
                if o.get("mono", mono):
                    font = ('<a:latin typeface="Courier New" pitchFamily="34" charset="0"/>'
                            '<a:ea typeface="Courier New" pitchFamily="34" charset="-122"/>'
                            '<a:cs typeface="Courier New" pitchFamily="34" charset="-120"/>')
                sp = ' xml:space="preserve"' if t != t.strip() else ""
                rx.append(f'<a:r><a:rPr lang="pt-BR" sz="{int(sz * 100)}"{b}{it} dirty="0">'
                          f'{self._fill(col)}{font}</a:rPr><a:t{sp}>{escape(t)}</a:t></a:r>')
            al = f' algn="{align}"' if align else ""
            spc = (f'<a:spcAft><a:spcPts val="{int(space_after * 100)}"/></a:spcAft>'
                   if space_after else "")
            ps.append(f'<a:p><a:pPr{al} indent="0" marL="0">{spc}<a:buNone/></a:pPr>'
                      f'{"".join(rx)}<a:endParaRPr lang="pt-BR" sz="{int(size * 100)}" dirty="0"/></a:p>')
        self.xml.append(
            f'<p:sp><p:nvSpPr><p:cNvPr id="{sid}" name="Text {sid}"/>'
            f'<p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr><p:spPr>{self._xfrm(x, y, w, h)}'
            f'<a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln/></p:spPr>'
            f'<p:txBody><a:bodyPr wrap="square" lIns="0" tIns="0" rIns="0" bIns="0" '
            f'rtlCol="0" anchor="{anchor}"/><a:lstStyle/>{"".join(ps)}</p:txBody></p:sp>')

    def shot(self, file, x, y, w=None, h=None, caption=None, name=None):
        """Framed screenshot (accent6 frame + shadow, like v2). Give w or h;
        the other follows the image's aspect ratio. Returns the frame box."""
        from PIL import Image
        iw, ih = Image.open(SHOTS / file).size
        if w is None:
            w = h * iw / ih
        elif h is None:
            h = w * ih / iw
        pad = 0.04
        fid = self._id()
        self.xml.append(
            f'<p:sp><p:nvSpPr><p:cNvPr id="{fid}" name="frame-{name or file}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>'
            f'<p:spPr>{self._xfrm(x - pad, y - pad, w + 2 * pad, h + 2 * pad)}'
            f'<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>'
            f'<a:solidFill><a:schemeClr val="accent6"/></a:solidFill>'
            f'<a:ln w="9525"><a:solidFill><a:schemeClr val="accent6"/></a:solidFill></a:ln>'
            f'<a:effectLst><a:outerShdw blurRad="152400" dist="50800" dir="5400000" algn="bl" rotWithShape="0">'
            f'<a:srgbClr val="000000"><a:alpha val="55000"/></a:srgbClr></a:outerShdw></a:effectLst>'
            f'</p:spPr></p:sp>')
        rid = f"rId{10 + len(self.images)}"
        media = "v3-" + file
        self.images.append((rid, media, file))
        pid = self._id()
        self.xml.append(
            f'<p:pic><p:nvPicPr><p:cNvPr id="{pid}" name="shot-{name or file}" descr="{escape(caption or file)}"/>'
            f'<p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr>'
            f'<p:blipFill><a:blip r:embed="{rid}"/><a:stretch><a:fillRect/></a:stretch></p:blipFill>'
            f'<p:spPr>{self._xfrm(x, y, w, h)}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>')
        if caption:
            self.text(x, y + h + 0.12, w, 0.3, caption, size=11, color="bg2", italic=True)
        return x, y, w, h

    def pill(self, x, y, label, color="accent1", w=None):
        w = w or 0.2 + 0.105 * len(label)
        self.box(x, y, w, 0.32, fill="tx2", line=color, adj=50000)
        self.text(x, y, w, 0.32, label, size=10, color=color, bold=True, mono=True,
                  align="ctr", anchor="ctr")

    def badge(self, x, y, label, color="accent1", d=0.32, size=11):
        self.box(x, y, d, d, fill=color, line=color, geom="ellipse")
        self.text(x, y, d, d, label, size=size, color="tx1", bold=True, align="ctr", anchor="ctr")

    def labeled(self, x, y, w, h, label, body, color="accent1", size=12.5):
        self.text(x, y, w, h, [[(label, {"bold": True, "color": color})], body],
                  size=size, space_after=2)


# ----------------------------------------------------------- slide edits ----


def remove_shapes(xml, *names):
    for n in names:
        pat = re.compile(r'<p:(sp|cxnSp|pic)>(?:(?!</p:\1>).)*?name="' + re.escape(n)
                         + r'"(?:(?!</p:\1>).)*?</p:\1>\s*', re.S)
        xml, k = pat.subn("", xml, count=1)
        assert k == 1, f"shape {n!r} not found"
    return xml


def add_shapes(xml, shapes):
    i = xml.index("<p:sp> <p:nvSpPr>  <p:cNvPr id=")  # slide-number placeholder
    return xml[:i] + "".join(shapes.xml) + xml[i:]


def set_kicker(xml, kicker):
    return re.sub(r'(idx="100".*?<a:t>)[^<]*(</a:t>)', lambda m: m.group(1) + escape(kicker) + m.group(2),
                  xml, count=1, flags=re.S)


def set_title(xml, title):
    return re.sub(r'(idx="101".*?<a:t>)[^<]*(</a:t>)', lambda m: m.group(1) + escape(title) + m.group(2),
                  xml, count=1, flags=re.S)


def replace_text(xml, old, new):
    old_e, new_e = escape(old), escape(new)
    assert old_e in xml, f"text {old!r} not found"
    return xml.replace(old_e, new_e)


def set_notes(xml, text):
    return re.sub(r'(<p:ph type="body" idx="1"/>.*?<a:t>).*?(</a:t>)',
                  lambda m: m.group(1) + escape(text) + m.group(2), xml, count=1, flags=re.S)


# ------------------------------------------------------------ the deck ------


def edit_title(x):
    return replace_text(x, "TCC II · Apresentação parcial · [data]",
                        "TCC II · Apresentação parcial · 16/10/2026")


def edit_related_work(x):
    """Adds a "Portugol + blocos" column to the comparison table."""
    first, col = 2560320, 1417320  # 2.8" + 6 × 1.55" = same 12.1" table width
    x = re.sub(r"<a:tblGrid>.*?</a:tblGrid>",
               "<a:tblGrid>" + f'<a:gridCol w="{first}"/>' + f'<a:gridCol w="{col}"/>' * 6 + "</a:tblGrid>",
               x, count=1, flags=re.S)
    rows = re.findall(r"<a:tr .*?</a:tr>", x, re.S)
    for i, row in enumerate(rows):
        last = re.findall(r"<a:tc>.*?</a:tc>", row, re.S)[-1]
        if i == 0:
            cell = re.sub(r"<a:t>[^<]*</a:t>", "<a:t>Portugol + blocos</a:t>", last)
        else:
            cell = last  # "—" for the other systems, "●" on the WhyRunner row
        x = x.replace(row, row.replace("</a:tr>", cell + "</a:tr>"), 1)
    x = replace_text(x, "dicas por IA, aulas montadas pelo professor e restrições de solução: verificar ",
                     "dicas por IA, aulas montadas pelo professor, Portugol com blocos e restrições de solução: verificar ")
    return x


CITE_ISOLATE = "MAREŠ; BLACKHAM, 2012"


def edit_stages(x):
    return replace_text(x, "isolate (usado na IOI)", f"isolate (usado na IOI; {CITE_ISOLATE})")


def edit_discussion(x):
    return replace_text(x, "Isolamento no nível da IOI, sem Docker privilegiado",
                        f"Isolamento no nível da IOI ({CITE_ISOLATE}), sem Docker privilegiado")


def edit_references(x):
    """Adds the Claude Haiku entry (first, alphabetically) to the left column."""
    para = re.search(r'<a:p><a:pPr[^>]*><a:spcAft>.*?<a:t>BROOKE, J\.', x, re.S)
    start = para.start()
    end = x.index("</a:p>", start) + len("</a:p>")
    brooke = x[start:end]
    entry = re.sub(r"<a:t>[^<]*</a:t>",
                   "<a:t>ANTHROPIC. Claude Haiku 5.5. 2026. Disponível em: https://www.anthropic.com/claude.</a:t>",
                   brooke, count=1)
    return x[:start] + entry + x[start:]


def edit_architecture(x):
    x = replace_text(x, "Cada execução roda numa caixa sem rede, com limite de tempo, memória e processos.",
                     f"Caixa sem rede, com limite de tempo, memória e processos: o sandbox da IOI ({CITE_ISOLATE}).")
    x = remove_shapes(x, "Shape 39", "Text 40", "Shape 41", "Text 42")
    s = Shapes(60)
    y, h = 1.62, 0.66
    chain = [(3.2, "Gemini 3.5 Flash", "principal", "accent4", None),
             (5.95, "Gemini 3.5 Flash-Lite", "fallback 1", "accent4", None),
             (8.7, "Claude Haiku 5.5", "fallback 2 · se ANTHROPIC_API_KEY", "accent4", "dash")]
    for bx, name, sub, col, dash in chain:
        s.box(bx, y, 2.1, h, fill="151B23", line="accent6" if not dash else "accent4", dash=dash)
        s.text(bx, y + 0.08, 2.1, 0.3, name, size=12, color=col, bold=True, align="ctr")
        s.text(bx, y + 0.38, 2.1, 0.22, sub, size=9, color="bg2", align="ctr")
    for x1 in (5.3, 8.05):
        s.arrow(x1 + 0.03, y + h / 2, x1 + 0.62, y + h / 2, color="accent4")
        s.text(x1 - 0.05, y + h / 2 - 0.3, 0.75, 0.2, "falhou", size=8.5, color="bg2", align="ctr", mono=True)
    s.arrow(4.25, y + h, 4.25, 2.75, color="accent4", dash="dash")
    s.text(10.95, y - 0.02, 1.75, 0.72,
           ["30 s por tentativa", "IA só no Next.js: dicas, solução, revisão, narrativa, tags, algoritmo"],
           size=9, color="bg2")
    return add_shapes(x, s)


def edit_technical_validation(x):
    x = set_kicker(x, "06 · METODOLOGIA · VALIDAÇÃO TÉCNICA")
    x = set_title(x, "O judge é testado sozinho, sem o site")
    names = [f"Shape {i}" for i in (6, 7, 10, 11)] + [f"Text {i}" for i in (8, 9, 12, 13, 31, 32, 33, 34)]
    x = remove_shapes(x, *names)
    s = Shapes(60)
    rows = [
        ("Restrições estruturais", "12",
         "Laços aninhados e construções proibidas em cada linguagem, incluindo casos que não podem disparar (texto em strings)."),
        ("Correção, compilação, tempo", "8",
         "Aceito, resposta errada, erro de compilação com a saída do compilador, limite de tempo do problema."),
        ("Leitura do isolate", "4",
         "Interpretação do arquivo de metadados: tempo, memória, código de saída e sinal."),
        ("Ataques", "3",
         "Fork bomb, laço infinito e estouro de memória ficam contidos na caixa."),
        ("Todas as linguagens", "2",
         "C, C++, Java, Python, Rust e Portugol compilam e passam num eco simples."),
    ]
    top = 1.75
    for i, (label, n, desc) in enumerate(rows):
        ry = top + i * 0.99
        s.box(4.73, ry, 7.97, 0.85)
        s.text(4.95, ry, 0.6, 0.85, n, size=22, color="accent1", bold=True, anchor="ctr")
        s.text(5.6, ry + 0.1, 6.9, 0.68, [[(label, {"bold": True})], desc], size=12)
    return add_shapes(x, s)


def slide_problem_validation(s):
    s.shot("validacao-aprovada.png", 0.6, 1.75, w=6.9,
           caption="Solução de referência gerada pela IA, aprovada contra todos os casos de teste")
    steps = [
        ("Escolhe a linguagem", "Qualquer uma das 6 que o judge executa."),
        ("Gera com IA ou cola", "A IA escreve uma solução de referência a partir da descrição e dos casos salvos."),
        ("Valida no judge", "A solução roda contra todos os casos. Saída diferente = caso de teste errado."),
        ("Publicação travada", "Mudou um teste? É preciso validar de novo antes de publicar."),
    ]
    for i, (a, b) in enumerate(steps):
        y = 1.8 + i * 1.12
        s.badge(7.95, y, str(i + 1))
        s.text(8.45, y - 0.02, 4.25, 1.0, [[(a, {"bold": True})], b], size=12.5)


def slide_authoring(s):
    s.shot("ia-narrativa-tags.png", 0.6, 1.72, w=6.0, caption="Narrativa e tags geradas pela IA")
    s.shot("ia-revisao-topo.png", 6.95, 1.72, w=5.75, caption="Revisão com IA: casos de borda que faltam")
    s.shot("previsualizacao-topo.png", 6.95, 4.38, w=5.75)
    items = [("Narrativa", "um clique gera uma história para o enunciado."),
             ("Tags", "a IA sugere os temas do problema."),
             ("Revisão", "aponta ambiguidades e sugere casos de borda."),
             ("Pré-visualização", "o problema como o aluno vai ver (abaixo, à direita).")]
    for i, (a, b) in enumerate(items):
        s.text(0.6, 5.3 + i * 0.38, 6.0, 0.36, [[(a + ": ", {"bold": True, "color": "accent1"}), b]], size=12.5)


def slide_problem_bank(s):
    s.shot("lista-problemas-filtros.png", 0.6, 1.75, w=8.3,
           caption="Busca por código (DEMO) com o filtro de tags aberto")
    items = [("Busca", "por título ou pelo código do problema (DEMO-101)."),
             ("Dificuldade", "fácil, médio ou difícil."),
             ("Tags", "por tema, agrupadas: fundamentos, estruturas, algoritmos."),
             ("Meus", "só os problemas que eu criei, inclusive rascunhos."),
             ("Importar JSON", "vários problemas de uma vez, com o formato documentado.")]
    for i, (a, b) in enumerate(items):
        s.labeled(9.3, 1.8 + i * 0.92, 3.4, 0.85, a, b, size=12)


def slide_solve(s):
    s.shot("torneio-editor.png", 0.6, 1.72, w=7.95,
           caption="Torneio: enunciado, envios e editor lado a lado")
    items = [("Editor com destaque", "O mesmo do VS Code (Monaco), em 6 linguagens."),
             ("Salvo automaticamente", "No navegador, por problema e linguagem: “Salvo às 17:36”."),
             ("Cada envio guarda o código", "Expande, compara com o veredito e copia com um clique."),
             ("Teste que falhou", "Entrada, saída do aluno e saída esperada."),
             ("Explicar", "Pede à IA uma dica sobre o erro, no limite do torneio.")]
    for i, (a, b) in enumerate(items):
        s.labeled(8.95, 1.75 + i * 0.95, 3.75, 0.9, a, b, size=12)


def slide_create_contest(s):
    s.shot("torneio-configuracao.png", 0.6, 1.75, w=6.35,
           caption="Configuração: datas, privado e nível de IA")
    s.shot("torneio-busca-codigo.png", 7.35, 1.75, w=5.35,
           caption="Problemas adicionados buscando pelo código")
    items = [("Torneio privado", "participantes pedem para entrar e o professor aprova."),
             ("Assistência de IA", "desligada, conceito, dica ou precisa; vale no próximo pedido."),
             ("Problemas", "do banco, pelo código; viram A, B, C, D na ordem escolhida.")]
    for i, (a, b) in enumerate(items):
        s.labeled(7.35, 4.85 + i * 0.62, 5.35, 0.58, a, b, size=11.5)


def slide_leaderboard(s):
    s.shot("placar.png", 0.6, 1.72, w=8.4, caption="Placar de um torneio com dados de demonstração")
    items = [("1  4'", "tentativas e minuto da resolução"),
             ("★", "primeiro a resolver o problema"),
             ("verde / vermelho", "resolvido / só tentativas erradas"),
             ("Penalidade", "minutos das resoluções + 20 por tentativa errada (estilo ICPC)"),
             ("Ao vivo", "atualiza sozinho durante o torneio")]
    for i, (a, b) in enumerate(items):
        y = 1.8 + i * 0.9
        s.text(9.4, y, 3.3, 0.85, [[(a, {"bold": True, "mono": True, "color": "accent1"})], b], size=12)


def slide_formats(s):
    s.shot("formato-blocos.png", 0.6, 1.75, h=4.35, caption="Blocos: a resposta vira Portugol e roda no judge")
    s.shot("formato-parsons.png", 4.6, 1.75, w=4.55, caption="Parsons: ordenar e indentar linhas")
    s.shot("turma-codigo.png", 4.6, 4.55, w=4.55, caption="Turma: código para os alunos entrarem")
    items = [("Blocos", "Encaixe estilo Scratch. Bom para quem nunca programou."),
             ("Parsons", "As linhas certas, fora de ordem. Treina leitura de código."),
             ("Código da turma", "Seis letras, como ALG26B. O aluno digita e entra."),
             ("Aulas com prazo", "O professor cria atividades; a revisão abre após o prazo.")]
    for i, (a, b) in enumerate(items):
        s.labeled(9.55, 1.8 + i * 1.05, 3.15, 1.0, a, b, size=12)


def slide_pilot(s):
    s.pill(0.6, 1.72, "INFORMAL", color="accent2")
    s.text(1.75, 1.72, 10.9, 0.32,
           "5 colegas usaram o sistema no meu servidor do Discord, sem roteiro nem questionário",
           size=12, color="bg2", anchor="ctr")
    s.text(0.6, 2.3, 7.4, 0.35, "O QUE INCOMODOU → O QUE MUDOU", size=13, color="accent2", bold=True, mono=True)
    rows = [("Não dava para ver o código de cada tentativa no torneio",
             "Cada envio mostra o código, com botão de copiar"),
            ("O placar só mostrava medalhas",
             "Tentativas, minuto, ★ primeiro a resolver, penalidade, ao vivo"),
            ("Importar JSON dava “Invalid format: Required”",
             "Formato documentado e erro com o campo e o problema")]
    for i, (a, b) in enumerate(rows):
        y = 2.8 + i * 1.12
        s.box(0.6, y, 7.4, 0.98)
        s.badge(0.8, y + 0.33, "!", color="accent2")
        s.text(1.3, y + 0.1, 6.55, 0.8,
               [[(a, {"color": "bg2"})], [("→ ", {"color": "accent1", "bold": True}), (b, {"bold": True})]],
               size=12.5)
    s.text(8.4, 2.3, 4.3, 0.35, "O QUE AGRADOU", size=13, color="accent1", bold=True, mono=True)
    good = [("Visual", "O tema escuro, estilo terminal."),
            ("O nome", "“Why” lido como o “Uai” mineiro: a ideia é mostrar por que o código falhou.")]
    for i, (a, b) in enumerate(good):
        y = 2.8 + i * 1.12
        s.box(8.4, y, 4.3, 0.98)
        s.badge(8.6, y + 0.33, "+")
        s.text(9.1, y + 0.1, 3.45, 0.8, [[(a, {"bold": True})], b], size=12.5)
    s.text(8.4, 5.1, 4.3, 0.95,
           "Não substitui a avaliação com a turma: amostra pequena, de colegas, sem professor.",
           size=12, color="accent2", italic=True)


def slide_planned(s):
    cards = [("Aplicação", "Um torneio e uma aula com uma turma real de programação."),
             ("Usabilidade", "Questionário SUS com os alunos (nota de 0 a 100)."),
             ("Visão do professor", "Como foi criar a aula e o torneio, revisar envios e dosar a IA."),
             ("Uso", "Análise descritiva: veredictos, tempo até acertar e pedidos de dica.")]
    for i, (a, b) in enumerate(cards):
        x = 0.6 + i * 3.08
        s.box(x, 1.75, 2.85, 2.95)
        s.pill(x + 0.25, 1.98, "PLANEJADO", color="accent2", w=1.43)
        s.text(x + 0.25, 2.5, 2.4, 0.4, a, size=16, bold=True)
        s.text(x + 0.25, 3.05, 2.4, 2.0, b, size=13)
    s.box(0.6, 5.0, 12.1, 0.95)
    s.text(0.85, 5.0, 11.6, 0.95,
           [[("Ainda não aplicada. ", {"bold": True, "color": "accent2"}),
             ("Sem ela, a pergunta de pesquisa fica sem resposta: o teste no Discord não mede aprendizado "
              "nem a experiência do professor.", {})]],
           size=14, anchor="ctr")


def edit_cronograma(x):
    x = remove_shapes(x, "Text 5", "Text 9", "Text 13", "Text 17", "Text 21", "Text 25", "Shape 2")
    x = set_title(x, "Próximas etapas, em ordem")
    s = Shapes(60)
    for cx in (1.4, 3.4, 5.4, 7.4, 9.4):
        s.arrow(cx + 0.58, 3.3, cx + 1.92, 3.3, color="accent6")
    return add_shapes(x, s)


NOTES = {
    "problem_validation": (
        "Antes de publicar um problema, o autor precisa provar que os casos de teste estão certos. "
        "Escolhe a linguagem, cola uma solução de referência ou pede para a IA gerar uma a partir da descrição "
        "e dos casos salvos, e manda validar: a solução roda no judge contra todos os casos. "
        "Se alguma saída não bate, o erro está no caso de teste. E se ele mudar qualquer teste depois, "
        "a publicação trava até validar de novo."),
    "authoring": (
        "A criação de problemas tem três ajudas de IA. A narrativa: um clique gera uma pequena história "
        "para contextualizar o enunciado. As tags: a IA sugere os temas, como laços ou matemática. "
        "E a revisão: a IA lê a descrição e os casos e sugere casos de borda que faltam, como n igual a 1 "
        "ou o valor máximo que estoura 32 bits; cada um entra nos testes com um clique. "
        "A pré-visualização mostra o problema como o aluno vai ver."),
    "bank": (
        "O banco de problemas tem busca por título ou código, filtro por dificuldade, por tags agrupadas "
        "e um filtro só com os meus problemas. Também dá para importar vários problemas de um arquivo JSON."),
    "solve": (
        "Esta é a tela de resolver, aqui dentro de um torneio. O editor é o Monaco, o mesmo do VS Code, "
        "com destaque de sintaxe, e salva sozinho no navegador. Cada envio guarda o código, então o aluno "
        "sabe qual versão deu qual veredito e pode copiar. No caso que falhou ele vê a entrada, a própria "
        "saída e a esperada, e o botão Explicar pede uma dica à IA."),
    "create_contest": (
        "Criar um torneio é preencher nome, datas, se ele é privado e quanto a IA pode ajudar. "
        "No privado, o aluno pede para entrar e o professor aprova. Os problemas são buscados pelo código "
        "e viram A, B, C e D."),
    "leaderboard": (
        "O placar segue o estilo das maratonas: em cada célula, o número de tentativas e o minuto em que "
        "resolveu; a estrela marca quem resolveu primeiro. Empates são desfeitos pela penalidade: soma dos "
        "minutos mais 20 por tentativa errada. E atualiza sozinho durante o torneio."),
    "formats": (
        "Além de código, a aula aceita dois formatos para iniciantes. Blocos, no estilo Scratch: a resposta "
        "vira Portugol e roda no judge. E Parsons: as linhas certas, embaralhadas, para ordenar e indentar. "
        "Para entrar na turma, o aluno digita um código de seis letras."),
    "pilot": (
        "Antes da avaliação formal, fiz um teste informal com cinco colegas no meu servidor do Discord. "
        "Três reclamações viraram mudanças no sistema: o torneio não mostrava o código de cada tentativa, "
        "o placar só mostrava medalhas, e o erro de importar JSON não dizia nada. Do lado bom, gostaram do "
        "visual e do nome: o Why lido como o uai mineiro, que é justamente a ideia de explicar por que o "
        "código falhou. Mas é um teste pequeno, de colegas, sem professor: não substitui a avaliação."),
    "planned": (
        "A avaliação de verdade ainda não foi aplicada. O plano: um torneio e uma aula com uma turma real, "
        "o questionário SUS com os alunos, a visão do professor sobre criar a aula e o torneio, revisar os "
        "envios e dosar a IA, e uma análise descritiva dos dados do próprio sistema."),
    "technical": (
        "A validação técnica é do judge, separado do site: são 29 testes automatizados. A maior parte cobre "
        "as restrições estruturais, incluindo casos que não podem disparar. Os outros cobrem correção, "
        "compilação e tempo, a leitura dos metadados do isolate, ataques como fork bomb, laço infinito e "
        "estouro de memória, e um programa rodando em cada linguagem."),
    "related": (
        "Analisei quatro sistemas: Ataux, de 2021; o Gamma Online Judge, da UnB, de 2022; o Run Codes; e o "
        "BOCA, de 2004, usado na Maratona da SBC.\n\n"
        "Nenhum deles dá feedback explicativo: todos corrigem, nenhum ensina. Alguns têm placar em tempo "
        "real, mas nenhum deixa o professor montar uma aula ou exigir um algoritmo.\n\n"
        "O diferencial do WhyRunner está nas colunas de IA, aulas curadas, Portugol com blocos e "
        "restrições. Portugol com blocos é para quem nunca programou: o aluno encaixa blocos em português, "
        "eles viram Portugol e o código roda no judge como qualquer outra linguagem. E as restrições "
        "verificam como o aluno chegou na resposta."),
    "architecture": (
        "Esta é a arquitetura: dois serviços que só conversam pelo banco.\n\n"
        "Seguindo os números: o aluno submete, seja num problema, num torneio ou numa aula. A Server Action "
        "do Next.js grava a submissão como PENDING e dispara um NOTIFY no PostgreSQL. O judge, escrito em "
        "Rust, recebe esse aviso e busca os casos de teste. O isolate compila e executa o código; o trecho "
        "embaixo é o código real que monta essa chamada, com limite de tempo, memória e processos. Se o "
        "problema tem restrições, o código passa por análise estática e depois pela IA. Por fim o veredito "
        "é gravado e o aluno é notificado.\n\n"
        "A IA é chamada só pelo Next.js, nunca pelo judge, e passa por uma cadeia de modelos: primeiro o "
        "Gemini 3.5 Flash; se ele falhar ou passar de 30 segundos, o Gemini 3.5 Flash-Lite; e por último o "
        "Claude Haiku 5.5, quando a chave da Anthropic está configurada."),
    "cronograma": (
        "As próximas etapas, em ordem: atualizar o texto, preparar a avaliação, aplicar com a turma, "
        "analisar os dados, revisão final com a orientadora e a defesa. A etapa crítica é a três: sem ela "
        "não há resposta para a pergunta de pesquisa."),
}

# Final order: ("v2", n, kicker, editor, notes_key) or ("new", builder, kicker, title, notes_key)
ORDER = [
    ("v2", 1, None, edit_title, None),
    ("v2", 2, "01 · INTRODUÇÃO", None, None),
    ("v2", 3, "02 · PROBLEMA E OBJETIVOS", None, None),
    ("v2", 4, "03 · TRABALHOS RELACIONADOS", edit_related_work, "related"),
    ("v2", 5, "04 · METODOLOGIA · ETAPAS", edit_stages, None),
    ("v2", 6, "05 · METODOLOGIA · ARQUITETURA", edit_architecture, "architecture"),
    ("v2", 7, None, edit_technical_validation, "technical"),
    ("new", slide_problem_validation, "07 · METODOLOGIA · VALIDAÇÃO DOS PROBLEMAS",
     "Nenhum problema é publicado sem uma solução que passa", "problem_validation"),
    ("v2", 8, "08 · RESULTADOS", None, None),
    ("new", slide_authoring, "09 · RESULTADOS · CRIAÇÃO DE PROBLEMAS",
     "A IA ajuda o professor a escrever o problema", "authoring"),
    ("new", slide_problem_bank, "10 · RESULTADOS · BANCO DE PROBLEMAS",
     "Achar o problema certo pelo código, tema ou dificuldade", "bank"),
    ("new", slide_solve, "11 · RESULTADOS · RESOLVER",
     "O aluno vê o que enviou e por que falhou", "solve"),
    ("new", slide_create_contest, "12 · RESULTADOS · CRIAR TORNEIO",
     "O professor monta o torneio em uma tela", "create_contest"),
    ("new", slide_leaderboard, "13 · RESULTADOS · PLACAR",
     "Placar no estilo das maratonas de programação", "leaderboard"),
    ("v2", 9, "14 · RESULTADOS · IA NO TORNEIO", None, None),
    ("v2", 10, "15 · RESULTADOS · AULA", None, None),
    ("new", slide_formats, "16 · RESULTADOS · FORMATOS E TURMA",
     "Blocos e Parsons para quem está começando", "formats"),
    ("new", slide_pilot, "17 · AVALIAÇÃO · TESTE PILOTO",
     "Um teste informal já mudou o sistema", "pilot"),
    ("new", slide_planned, "18 · AVALIAÇÃO · PLANEJADA",
     "O que falta: a avaliação em sala de aula", "planned"),
    ("v2", 11, "19 · DISCUSSÃO", edit_discussion, None),
    ("v2", 12, "20 · CRONOGRAMA", edit_cronograma, "cronograma"),
    ("v2", 13, None, edit_references, None),
]


def build():
    tmp = Path(tempfile.mkdtemp())
    with zipfile.ZipFile(SRC) as z:
        z.extractall(tmp)
    ppt = tmp / "ppt"
    template = (ppt / "slides/slide7.xml").read_text("utf-8")
    sp = re.findall(r"<p:sp>.*?</p:sp>", template, re.S)
    head = template[:template.index(sp[2])]  # tree header + kicker + title placeholders
    tail = template[template.index(sp[-1]):]  # slide-number placeholder + closing tags
    notes_tpl = (ppt / "notesSlides/notesSlide7.xml").read_text("utf-8")

    ct = (tmp / "[Content_Types].xml").read_text("utf-8")
    prels = (ppt / "_rels/presentation.xml.rels").read_text("utf-8")
    pres = (ppt / "presentation.xml").read_text("utf-8")
    v2_rid = dict(re.findall(r'Id="(rId\d+)"[^>]*Target="slides/slide(\d+)\.xml"', prels))
    v2_rid = {int(n): r for r, n in v2_rid.items()}
    next_rid = max(int(r) for r in re.findall(r'Id="rId(\d+)"', prels)) + 1
    next_slide = 14
    sld_entries, sid = [], 256
    titles = []

    for entry in ORDER:
        if entry[0] == "v2":
            _, n, kicker, editor, notes_key = entry
            f = ppt / f"slides/slide{n}.xml"
            x = f.read_text("utf-8")
            if kicker:
                x = set_kicker(x, kicker)
            if editor:
                x = editor(x)
            f.write_text(x, "utf-8")
            if notes_key:
                nf = ppt / f"notesSlides/notesSlide{n}.xml"
                nf.write_text(set_notes(nf.read_text("utf-8"), NOTES[notes_key]), "utf-8")
            rid = v2_rid[n]
        else:
            _, builder, kicker, title, notes_key = entry
            n = next_slide
            next_slide += 1
            s = Shapes(20)
            builder(s)
            x = set_title(set_kicker(head, kicker), title) + "".join(s.xml) + tail
            x = x.replace('<p:cSld name="Slide 7">', f'<p:cSld name="Slide {n}">')
            (ppt / f"slides/slide{n}.xml").write_text(x, "utf-8")
            rels = ['<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout2.xml"/>',
                    f'<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesSlide" Target="../notesSlides/notesSlide{n}.xml"/>']
            for rid_img, media, file in s.images:
                shutil.copy(SHOTS / file, ppt / "media" / media)
                rels.append(f'<Relationship Id="{rid_img}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/{media}"/>')
            (ppt / f"slides/_rels/slide{n}.xml.rels").write_text(
                '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                f'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">{"".join(rels)}</Relationships>',
                "utf-8")
            (ppt / f"notesSlides/notesSlide{n}.xml").write_text(set_notes(notes_tpl, NOTES[notes_key]), "utf-8")
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
        titles.append(f"Slide {len(titles) + 1}")

    pres = re.sub(r"<p:sldIdLst>.*?</p:sldIdLst>", "<p:sldIdLst>" + "".join(sld_entries) + "</p:sldIdLst>", pres, flags=re.S)
    (ppt / "presentation.xml").write_text(pres, "utf-8")
    (ppt / "_rels/presentation.xml.rels").write_text(prels, "utf-8")
    (tmp / "[Content_Types].xml").write_text(ct, "utf-8")

    app = tmp / "docProps/app.xml"
    a = app.read_text("utf-8")
    count = len(ORDER)
    a = re.sub(r"<Slides>\d+</Slides>", f"<Slides>{count}</Slides>", a)
    a = re.sub(r"<Notes>\d+</Notes>", f"<Notes>{count}</Notes>", a)
    a = re.sub(r"(<vt:lpstr>Slide Titles</vt:lpstr></vt:variant>\s*<vt:variant><vt:i4>)\d+", rf"\g<1>{count}", a)
    a = re.sub(r'<vt:vector size="\d+" baseType="lpstr">(.*?)</vt:vector>',
               lambda m: f'<vt:vector size="{3 + count}" baseType="lpstr">'
                         + "".join(re.findall(r"<vt:lpstr>(?:Arial|Calibri|Office Theme)</vt:lpstr>", m.group(1)))
                         + "".join(f"<vt:lpstr>{t}</vt:lpstr>" for t in titles) + "</vt:vector>",
               a, count=1, flags=re.S)
    app.write_text(a, "utf-8")

    OUT.unlink(missing_ok=True)
    with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as z:
        for p in sorted(tmp.rglob("*")):
            if p.is_file():
                z.write(p, p.relative_to(tmp).as_posix())
    shutil.rmtree(tmp)
    print(f"wrote {OUT.name} ({count} slides)")


if __name__ == "__main__":
    build()
