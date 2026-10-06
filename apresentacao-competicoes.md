# Competições no ensino de informática e o WhyRunner

Roteiro de apresentação baseado em:

> AUDRITO, G.; DEMO, G. B.; GIOVANNETTI, E. *The Role of Contests in Changing Informatics Education: A Local View*. Olympiads in Informatics, v. 6, p. 3–20, 2012.

As citações do artigo são traduções livres.

---

## 1. O problema: informática ensinada como "uso de ferramentas"

**Slide:**
- Informática na escola ainda é vista como habilidade prática, não como ciência
- Alunos pedem "receitas" prontas em vez de aprender a resolver problemas
- Mudar currículos é lento e difícil

**Fala:**
> Audrito, Demo e Giovannetti (2012) descrevem um cenário que nos é familiar: a informática ainda é vista principalmente como o uso de programas, não como uma ciência com o mesmo peso da matemática ou da física. Os autores observam também que muitos alunos querem um catálogo de problemas com a receita de solução de cada um, ou seja, querem executar algoritmos em vez de aprender a criá-los. E mudar o currículo diretamente é um processo lento.

## 2. Por que competições ajudam a ensinar

**Slide:**
- Competições trazem tarefas mais criativas que os exercícios de sala
- Motivação: o aluno se testa contra um desafio real
- Uma "porta lateral" para levar programação de verdade à escola

**Fala:**
> A proposta dos autores é usar as competições como uma alavanca, uma forma de introduzir "pela lateral" aquilo que é difícil de conseguir diretamente. Na competição o aluno encontra tarefas mais criativas do que as do dia a dia e tem um motivo concreto para se esforçar. Para os autores, todas essas competições colocam a programação no centro do ensino de informática, e é nela que está o fascínio da área: inventar um objeto, o programa, que parece ganhar vida própria.

## 3. As duas condições para funcionar

**Slide:**
- Não só para os mais talentosos: envolver o maior número possível de alunos e professores
- Integrar o treino ao trabalho cotidiano da escola
- Ambientes virtuais onde alunos e professores interagem e discutem soluções

**Fala:**
> Os autores fazem duas ressalvas. Primeiro, a competição não pode ficar restrita a um pequeno grupo de alunos talentosos; ela precisa envolver toda a turma e os professores, que aprendem junto com os alunos. Segundo, o treino tem que fazer parte do trabalho normal da escola, apoiado por ambientes virtuais em que o aluno consegue tirar dúvidas, discutir problemas e receber ajuda.

## 4. O limite do corretor automático

**Slide:**
- Juízes automáticos só verificam se a saída está certa
- Mostrar a solução pronta não ensina como chegar até ela
- É preciso guiar o raciocínio, não entregar a resposta

**Fala:**
> O artigo também aponta um limite importante: o corretor automático só confere se a saída está correta. Ele não diz por que o programa errou, nem se o aluno usou a técnica que deveria aprender. E os autores alertam que entregar a solução ao aluno, explicando por que ela funciona mas não como chegar nela, não é suficiente: o professor precisa comunicar o caminho do raciocínio.

## 5. Onde entra o WhyRunner

**Slide:**
- **Turmas, aulas e exercícios:** competição e treino integrados ao dia a dia da turma
- **Dicas com IA:** apontam o erro de lógica sem entregar a solução
- **Restrições de solução:** o professor exige ou proíbe estruturas e algoritmos
- **Feedback do professor** por exercício
- **Portugol**, além de C, C++, Java, Python e Rust: acessível para iniciantes
- Execução segura e isolada, com limites de tempo e memória

**Fala:**
> O WhyRunner foi pensado justamente para essas lacunas. Além das competições em tempo real, ele tem um modelo de turmas e aulas: o professor monta listas de exercícios, os alunos submetem pelo mesmo juiz e o professor deixa um comentário em cada exercício. Isso atende às duas condições do artigo, levando o treino para a rotina da turma. Quando o aluno erra, pode pedir uma dica à IA, que explica o erro de lógica sem entregar a resposta, que é o "guiar o caminho" que os autores defendem. O professor também pode definir restrições de solução, por exemplo exigir um certo algoritmo ou proibir certas construções, para que acertar a saída não seja o único critério. E o suporte a Portugol permite que alunos que estão começando participem desde o início.

## 6. Fechamento

**Slide:**
- Competição como ferramenta de ensino, não só de seleção
- Ainda falta a avaliação em sala de aula (trabalho futuro)

**Fala:**
> Em resumo: a competição é uma ferramenta de ensino, não só uma forma de selecionar os melhores alunos, e o WhyRunner tenta levar isso para dentro da sala de aula. O próximo passo é justamente usá-lo com uma turma real e medir os resultados.

---

## Notas para a apresentação

- Coloque a referência do artigo no slide 2 ou no final.
- No slide 6, não diga que o WhyRunner já foi validado com alunos. A tese diz que a avaliação em sala de aula ainda não foi feita, e a banca pode perguntar.
- O artigo critica o juiz automático por não avaliar a qualidade do código. As restrições do WhyRunner ajudam em parte, mas são heurísticas e não avaliam elegância, então não diga que resolvem isso por completo.
