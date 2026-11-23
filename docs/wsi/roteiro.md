# Roteiro — VIII WSI, fast-track de TCC (03/12/2026)

Quatro slides, no máximo 3 minutos: cerca de 45 s por slide (≈ 110 palavras cada, em
ritmo de fala calmo). PDF: `docs/wsi/slides.pdf`, gerado por `python3 docs/wsi/build.py`.

Os números vêm de `bench/results/` (os mesmos do artigo e do deck v5).

---

## 1 · Título (≈ 45 s)

> Bom dia. Eu sou o Juan Israel dos Anjos, do Bacharelado em Sistemas de Informação do
> IFMG, e meu TCC, orientado pela professora Suellen Mapa, é o **WhyRunner**: um juiz
> online para programação competitiva e para o ensino de programação.
>
> Um juiz online recebe o código do aluno, roda contra casos de teste e devolve um
> veredito, como esses aqui ao lado: aceito, resposta errada, tempo excedido, memória
> excedida, erro de compilação, erro de execução. O nome vem de "why", "por quê", e
> também soa como o "uai" mineiro, porque a ideia é justamente responder *por que* o
> código errou.

## 2 · O problema e a solução (≈ 45 s)

> O problema: nos juízes online comuns, o aluno envia e recebe só "Wrong Answer". Não
> sabe em que caso errou, nem o que fazer a seguir. Para quem está começando, isso
> desanima.
>
> No WhyRunner, o aluno vê o veredito, em qual caso de teste falhou e quantos passaram.
> E, se travar, clica em **Explicar**: uma IA comenta o erro **sem entregar a resposta**,
> e é o professor quem decide se a dica fica ligada. Funciona em seis linguagens,
> incluindo Portugol, que é o que muitos alunos usam no primeiro ano.

## 3 · Como funciona (≈ 45 s)

> Por dentro: o site, em Next.js, grava o envio no PostgreSQL e avisa o juiz pelo
> próprio banco, com LISTEN/NOTIFY, sem fila externa. O judge, escrito em Rust, pega o
> envio, compila e roda cada caso de teste dentro do **isolate**, o mesmo sandbox da
> Olimpíada Internacional de Informática: sem rede e com limite de tempo e memória.
> O veredito volta para o banco e aparece para o aluno.
>
> Para o professor, há aulas e listas com prazo e boletim, torneios com placar ao vivo
> e detecção de plágio entre as soluções da turma.

## 4 · Resultados (≈ 45 s)

> Os resultados têm duas partes. Primeiro, benchmarks reproduzíveis, com scripts e
> dados no repositório: sem fila, o veredito sai em menos de 0,4 segundo, exceto Java
> e Portugol; com 8 workers o judge julga 3,8 vezes mais envios que com um; e o isolate
> custa só uns 5 milissegundos por execução.
>
> Segundo, um teste em sala, em 29 de outubro: 30 alunos do primeiro ano do técnico
> integrado fizeram uma lista no sistema. A usabilidade, medida pelo SUS, ficou em
> **72,1**, acima da referência de 68. O que eles mais valorizaram foi a dica da IA e a
> correção imediata.
>
> A limitação: foi uma turma, uma lista, só alunos. Torneios e o uso por professores
> ainda não foram avaliados. Obrigado.

---

### Lembretes

- Tempo total ≈ 3 min; se apertar, cortar a frase sobre o nome "uai" (slide 1) e a
  lista de recursos do professor (slide 3).
- Não arredondar o SUS para cima nem chamar os alunos de "universitários": são do 1º ano
  do técnico integrado ao ensino médio.
- Pergunta provável: "por que 3,8× e não 8×?" — compiladores e a JVM disputam CPU e
  disco; e em produção (1 vCPU na Fly.io) mais workers não ajudam.
