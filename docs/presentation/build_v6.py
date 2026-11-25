#!/usr/bin/env python3
"""Build the 10-minute TCC II defense deck v6 from v5's builders.

    python3 docs/presentation/build_v6.py

Reads  "WhyRunner — Apresentação Parcial TCC II v3.pptx" (repo root, untouched, via build_v5)
Writes "WhyRunner — Apresentação TCC II v6.pptx"         (repo root)
       docs/presentation/v6-slides.txt                    (slide listing)

v6 is the defense cut of v5 (98 slides, ~4,200 note words, 30-35 min):
- 25 of v5's slides, same builders, screenshots and charts, in v5's order;
- no section dividers, no agenda, no references;
- the per-section step tracker becomes a deck-wide section progress bar
  (done / current / next) and kickers drop v5's "NN · " part number;
- notes rewritten short and spoken (~1,300 words, ~10 min at 130-150
  words per minute); the build prints the total and the estimate.

Numbers in titles and notes still come from bench/results via build_v5's data.
"""

import importlib.util
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
OUT = ROOT / "WhyRunner — Apresentação TCC II v6.pptx"
LISTING = HERE / "v6-slides.txt"

sys.dont_write_bytecode = True
_spec = importlib.util.spec_from_file_location("build_v5", HERE / "build_v5.py")
v5 = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(v5)
v4 = v5.v4
fmt, ms, shot, chart = v5.fmt, v5.ms, v5.shot, v5.chart
AIR, PQ, CC, E2E, VD, SV, c100 = v5.AIR, v5.PQ, v5.CC, v5.E2E, v5.VD, v5.SV, v5.c100
SLIDE_W, MAX_BODY_WORDS = v5.SLIDE_W, v5.MAX_BODY_WORDS

WPM = (130, 150)
MAX_NOTE_WORDS = 70

# (chip label, kicker)
SECTIONS = [("intro", "INTRODUÇÃO"), ("professor", "O PROFESSOR"), ("aluno", "O ALUNO"),
            ("aulas", "AULAS E TURMA"), ("plágio", "PLÁGIO"), ("por dentro", "POR DENTRO"),
            ("desempenho", "DESEMPENHO"), ("avaliação", "AVALIAÇÃO"), ("fecho", "DISCUSSÃO")]
KICKER_RIGHT = 0.6 + 4.5  # build_v5 narrows the kicker box to 4.5 in from x = 0.6 in


def progress(s, current):
    """Deck-wide section bar in the kicker row: done sections tinted, current filled, next outlined."""
    size, pad, gap = 9, 0.22, 0.08
    labels = [lab for lab, _ in SECTIONS]
    widths = [pad + 0.6 * size / 72 * len(lab) for lab in labels]
    x = SLIDE_W - 0.6 - sum(widths) - gap * (len(labels) - 1)
    if x < KICKER_RIGHT:
        s.overflow.append(f"progress bar starts at x={x:.2f}, inside the kicker box")
    at = labels.index(current)
    for i, (lab, w) in enumerate(zip(labels, widths)):
        if i < at:
            fill, line, color = v5.GREEN_TINT, "accent1", "accent1"
        elif i == at:
            fill, line, color = "accent1", "accent1", "tx1"
        else:
            fill, line, color = "tx2", "accent6", "bg2"
        s.box(x, 0.35, w, 0.26, fill=fill, line=line, adj=50000)
        s.text(x, 0.35, w, 0.26, lab, size=size, color=color, bold=i == at, mono=True, align="ctr",
               anchor="ctr", count=False)
        x += w + gap


SLIDES = []  # build_v5's tuple: (kind, ref, kicker, title, builder, notes, track, max_words)
STATE = {"section": None}


def section(label):
    STATE["section"] = label


def add(title, builder, notes, max_words=MAX_BODY_WORDS, bar=True):
    label = STATE["section"]
    kicker = dict(SECTIONS)[label] if bar else ""

    def build(s):
        if bar:
            progress(s, label)
        builder(s)
    SLIDES.append(("new", None, kicker, title, build, notes, None, max_words))


# ---- introdução (1:15)
section("intro")
add("", v5.b_cover,
    "Boa tarde. Eu sou o Juan, e este é o WhyRunner: um juiz online para ensinar programação, com dicas de IA "
    "que o professor controla. Em dez minutos: o problema, o sistema, os números e o que uma turma achou dele.",
    bar=False)
add("Juízes online corrigem código; ensinar é outra coisa", v4.b_wrong_answer,
    "Um juiz online roda o código do aluno contra casos de teste e devolve um veredito. No BOCA, o da Maratona, "
    "o aluno recebe só isto: Wrong Answer, sem dizer onde nem por quê. Para quem está aprendendo, isso não "
    "ensina. Eu vivi isso nas maratonas.")
add("A pergunta que guia o trabalho", v5.b_question,
    "Daí a pergunta de pesquisa: feedback de IA, somado a atividades montadas pelo professor, torna um juiz "
    "online útil para ensinar? Para responder, construí o WhyRunner e levei para uma turma de verdade. A seguir: "
    "o que foi construído, quanto ele aguenta e o que os alunos disseram.",
    max_words=20)
add("O que BOCA, Run Codes, Ataux e GOJ não oferecem", v5.b_unique,
    "Comparei quatro sistemas: o BOCA, o Run Codes, o Ataux e o GOJ, da UnB. Turmas e listas com prazo não são "
    "novidade; o Ataux e o Run Codes têm. O que nenhum oferece: dicas de IA, restrições de como resolver, e "
    "blocos e Parsons para quem nunca programou.", max_words=24)

# ---- professor (1:30)
section("professor")
add("Ao criar um problema, ele só é publicado com uma solução que passa", shot("validacao-aprovada.png"),
    "Começando pelo professor. Um problema novo só é publicado se uma solução de referência passar em todos os "
    "casos de teste. O judge roda a solução na hora e mostra qual saída não bateu. Se uma saída não bate, o erro está no teste, não no aluno. E se o professor mudar um caso "
    "depois, a publicação trava até validar de novo.")
add(f"A IA escreve essa solução: passou em {AIR['python']['passed'] + AIR['c']['passed']} de 20 problemas",
    chart("ai_reference", "Soluções de referência geradas pela IA, julgadas pelo judge"),
    f"A solução de referência pode vir da IA. Medi: soluções em Python e em C para os dez problemas de exemplo, "
    f"julgadas no judge. Python passou em {AIR['python']['passed']}; C, em {AIR['c']['passed']}. As duas falhas "
    f"vieram do último modelo da cadeia, o Claude Haiku, que escreveu uma frase antes do código, e não compilaram. "
    f"É exatamente o que a validação pega.")
add("O professor também decide quanto a IA ajuda no torneio", v4.b_ai_levels,
    "No torneio, o professor decide quanto a IA ajuda. São quatro níveis: desligada; conceito, que só nomeia a "
    "área do erro; dica, que explica sem código; e precisa, que aponta a linha. O servidor aplica o máximo, e o "
    "aluno libera um nível por vez. A mudança vale a partir do próximo pedido, então dá para ajustar durante o "
    "torneio.")

# ---- aluno (0:45)
section("aluno")
add("Cada tentativa recebe um veredito com nome e cor",
    shot("v4-verdicts-contest.png", "Seis tentativas, seis vereditos"),
    "Agora o aluno. Cada envio recebe um de seis vereditos, com nome e cor: aceito, resposta errada, tempo "
    "excedido, memória excedida, erro de compilação e erro de execução. Antes, o judge só dizia passou ou "
    "falhou. Erro de compilação, como nas maratonas, não conta penalidade no placar.")
add("Ao errar, ele vê o caso que falhou e pode pedir uma explicação", shot("submissoes-explicar.png"),
    "Cada envio guarda o código, então o aluno sabe qual versão deu qual veredito. Ao errar um exemplo público, ele vê a entrada, a própria saída e a esperada; num caso escondido, só o "
    "número do caso. E o botão Explicar pede à IA uma dica sobre o erro, dentro do nível que o professor "
    "liberou.")

# ---- aulas e turma (0:45)
section("aulas")
add("Para quem nunca programou, a resposta pode ser em blocos", shot("formato-blocos.png"),
    "Fora dos torneios, há turmas, e cada aula é uma lista de exercícios com prazo. Para quem nunca programou, a "
    "resposta pode ser em blocos, no estilo Scratch, com rótulos em português. Os blocos viram Portugol, que "
    "roda no judge como qualquer linguagem. Aqui, a entrega de um aluno, com o Portugol gerado embaixo.")
add("O professor pode exigir como resolver, não só o resultado", shot("solution-constraints.png"),
    "O professor também pode exigir como resolver, não só o resultado: limitar laços aninhados, proibir ou "
    "exigir construções, ou pedir um algoritmo, que a IA confere. Uma solução certa que viola a restrição "
    "recebe um veredito próprio. Por exemplo: resolver sem laço aninhado, ou exigir busca binária.")

# ---- plágio (0:45)
section("plágio")
add("Lado a lado, os trechos iguais aparecem destacados", shot("v4-similarity-side-by-side.png"),
    "Com os envios da turma, o professor vê os pares mais parecidos e abre um deles lado a lado. Aqui, a aluna "
    "renomeou tudo e pôs comentários, e mesmo assim deu cem por cento. Nota alta é motivo para ler os dois "
    "códigos, não prova de cópia.")
add(f"Com o limiar de {fmt(PQ['best_f1_pair']['threshold'], 2)}: {fmt(PQ['best_f1_pair']['precision'] * 100, 0)}% "
    f"de precisão e {fmt(PQ['best_f1_pair']['recall'] * 100, 1)}% de revocação",
    chart("plagiarism_roc", f"{PQ['copies']} cópias contra "
                            f"{PQ['negatives_same_problem'] + PQ['negatives_other_problem']} pares independentes"),
    f"O algoritmo é o do MOSS: winnowing sobre o código normalizado. Para medir, gerei {PQ['copies']} cópias "
    f"ofuscadas de 36 soluções independentes. Com o limiar de {fmt(PQ['best_f1_pair']['threshold'], 2)}, "
    f"{fmt(PQ['best_f1_pair']['precision'] * 100, 0)}% de precisão e "
    f"{fmt(PQ['best_f1_pair']['recall'] * 100, 1)}% de revocação. Ressalva: as ofuscações são automáticas, não "
    f"as de um aluno esperto.")

# ---- por dentro (1:00)
section("por dentro")
add("Por trás de tudo isso, dois serviços que só conversam pelo banco", v5.b_arch,
    "Por dentro, são dois serviços que só conversam pelo banco. O Next.js grava o envio como pendente e dispara "
    "um NOTIFY no PostgreSQL. O judge, em Rust, está escutando: pega o envio, roda cada caso no sandbox e grava "
    "o veredito. Sem fila externa e sem API entre os dois. A IA fica no Next.js, numa cadeia de três modelos.",
    max_words=16)
add("Todo código do aluno roda numa caixa sem rede", v4.b_isolate,
    "Todo código do aluno roda no isolate, o sandbox da Olimpíada Internacional de Informática. Cada caso de "
    "teste ganha uma caixa nova: sem rede, com limite de tempo, de memória e de 64 processos, o que segura fork "
    "bomb. Depois, a caixa é destruída. Não precisa de Docker privilegiado, só de duas capabilities do Linux.")

# ---- desempenho (1:15)
section("desempenho")
n8 = CC["burst100-n8"]
add(f"Com 8 workers, metade da turma espera menos de {fmt(n8['latency_p50_s'], 0)} s, não "
    f"{fmt(c100['latency_p50_s'], 0)} s",
    chart("concurrency_latency", "Rajada de 100 envios: espera até o veredito"),
    f"Desempenho. Simulei uma turma enviando ao mesmo tempo: cem envios nas seis linguagens. Com um worker, a "
    f"espera mediana é de {fmt(c100['latency_p50_s'], 0)} segundos; com oito, cai para "
    f"{fmt(n8['latency_p50_s'], 0)}. Não escala linearmente, porque compiladores e a JVM disputam CPU e "
    f"disco. Ressalva honesta: em produção o judge tem uma vCPU, e aí mais workers não "
    f"ajudam.")
add("Sem fila, o veredito sai em menos de 0,4 s, exceto Java e Portugol",
    chart("e2e_stages", "Um envio por vez, judge ocioso, 5 casos de teste"),
    f"Medi do INSERT no banco até o veredito gravado, com cinco casos de teste e o judge livre. O veredito sai "
    f"rápido: C em {ms(E2E['c']['total_ms'])}, Python em "
    f"{ms(E2E['python']['total_ms'])}. Java leva {ms(E2E['java']['total_ms'])}, por causa da JVM, e Portugol "
    f"{ms(E2E['portugol']['total_ms'])}, porque o interpretador recompila o programa a cada caso de teste.")
add(f"O judge acertou {VD['correct']} de {VD['programs']} vereditos; os erros têm causa conhecida",
    chart("verdict_confusion", "2 programas por veredito × 6 linguagens"),
    f"E os vereditos estão certos? Escrevi dois programas para cada veredito em cada linguagem: "
    f"{VD['programs']}. O judge acertou {VD['correct']}. Aceito, resposta errada e tempo excedido: cem por cento. "
    f"Seis dos nove erros são do Portugol, que imprime o "
    f"erro e termina com sucesso; os outros vêm do Python, sem etapa de compilação, e da memória. Fora do Portugol, 57 de 60.")

# ---- avaliação (1:45)
section("avaliação")
add(f"{SV['responses']} alunos fizeram uma lista em sala, em 29/10/2026",
    v4.b_big_numbers([(str(SV["responses"]), "alunos responderam", "accent1"),
                      (str(SV["never_used_judge"]), "nunca usaram um juiz", "accent5"),
                      ("1", "lista, em Python", "accent4")],
                     "1º ano do Técnico em Informática integrado · IFMG"),
    f"A avaliação: em 29 de outubro, uma turma do primeiro ano do Técnico em Informática do IFMG resolveu uma "
    f"lista em Python no WhyRunner. Logo depois, {SV['responses']} alunos responderam o questionário, dentro do "
    f"próprio sistema; {SV['never_used_judge']} nunca tinham usado um juiz online. Só alunos e só uma lista: não "
    f"houve torneio nesse teste.", max_words=18)
add(f"SUS {fmt(SV['sus']['mean'])}: acima da referência de {SV['sus']['benchmark']}",
    chart("survey_sus_bands", f"Mediana {fmt(SV['sus']['median'])} · desvio {fmt(SV['sus']['sd'])} · "
                              f"IC 95%: {fmt(SV['sus']['ci95'][0])} a {fmt(SV['sus']['ci95'][1])}"),
    f"A usabilidade, medida pelo SUS, ficou em {fmt(SV['sus']['mean'])}, acima da referência de "
    f"{SV['sus']['benchmark']}: boa, na escala de Bangor. A mediana, {fmt(SV['sus']['median'], 0)}, é maior: "
    f"13 dos 30 deram nota A. O ponto fraco foi a confiança, o que faz sentido numa turma que nunca tinha usado "
    f"um juiz.", max_words=16)
add("O que mais ajudou: a IA e a correção imediata",
    v5.b_quotes([("~14", "dicas da IA", "As dicas sem entregar a resposta da IA", "accent4"),
                 ("~9", "correção imediata", "respostas e feedbacks quase imediatos", "accent1")]),
    "Na pergunta aberta sobre o que mais ajudou, cerca de 14 alunos citaram as dicas da IA, que ajudam sem "
    "entregar a resposta, e cerca de 9, a correção imediata. São justamente as duas coisas da pergunta de "
    "pesquisa, agora na voz dos alunos. Os sete comentários gerais foram todos positivos.")
add("Do retorno da turma às correções", v5.b_fixes,
    "O que atrapalhou virou correção, já em produção: tela cheia no editor, a saída e o erro do Python nos casos "
    "visíveis, painel da IA rolável, rascunho que não se perde e um botão Executar. A maior reclamação, saída "
    "idêntica espaço por espaço, é o próximo passo: passar os problemas para o modo tokens.", max_words=60)

# ---- discussão (1:00)
section("fecho")
add("A maior limitação: uma turma, uma lista, só alunos",
    v5.b_limit("30 alunos, uma aula, sem grupo de comparação. Torneio e professor ainda não foram avaliados."),
    "A maior limitação: foi uma turma, uma aula, só alunos, sem grupo de comparação nem medida antes e depois. "
    "Pode haver efeito de novidade. O torneio e a visão do professor ainda não foram avaliados em sala. Por "
    "isso, o resultado é um primeiro sinal, não uma prova.",
    max_words=20)
add("Próximos passos", v5.b_future,
    "Próximos passos. O primeiro é o mais importante: avaliar o torneio e o professor em sala, porque até aqui só "
    "os alunos foram ouvidos. Depois, passar a comparação para tokens; detectar código "
    "gerado por IA, que o plágio de hoje não pega; e ativar os cgroups do isolate, para medir memória de "
    "verdade.", max_words=16)
add("", v5.b_thanks,
    "Então, respondendo à pergunta: neste primeiro teste, os alunos apontaram justamente a IA e a correção "
    "imediata como o que mais ajudou. Obrigado. Fico à disposição para perguntas.", bar=False)


def timing():
    words = [len(notes.split()) for *_, notes, _, _ in SLIDES]
    for i, n in enumerate(words, 1):
        if n > MAX_NOTE_WORDS:
            print(f"LINT slide {i}: {n} note words (max {MAX_NOTE_WORDS})")
    total = sum(words)
    lo, hi = (total / w for w in reversed(WPM))
    print(f"notes: {total} words, {total / len(words):.0f} per slide; "
          f"~{lo:.1f}-{hi:.1f} min at {WPM[1]}-{WPM[0]} words/min")


if __name__ == "__main__":
    timing()
    v5.build(SLIDES, OUT, LISTING)
