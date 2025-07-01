import { db } from '@/server/db';

async function main() {
	const user = await db.user.findUnique({
		where: { email: 'juaniwk3@gmail.com' },
	});

	if (!user) {
		throw new Error('User not found');
	}

	await db.contest.deleteMany({
		where: {
			name: 'Você tem brio? 2025',
		},
	});

	const contest1 = await db.contest.create({
		data: {
			createdById: user.id,
			end: new Date(Date.now() + 60 * 1000 * 60), // 60 minutes of duration
			name: 'Você tem brio? 2025',
			start: new Date(Date.now() + 60 * 1000 * 0.5), // 10 minutes from now
		},
	});

	await db.problem.createManyAndReturn({
		data: [
			{
				contestId: contest1.id,
				userId: user.id,
				title: 'Caça ao Tesouro Histórico',
				difficulty: 'EASY',
				description:
					"Um grupo de estudantes de informática de Ouro Branco decidiu fazer uma excursão para a cidade vizinha, Ouro Preto. Uma lenda local diz que, para homenagear os 12 profetas de Aleijadinho, cada uma das grandes igrejas da cidade esconde uma certa quantidade de barras de ouro. O professor de história, um entusiasta de lendas, lançou um desafio: ele informou aos alunos um número 'mágico' de barras de ouro, e a turma precisa descobrir quantas igrejas possuem exatamente essa quantidade. Você, o programador da turma, ficou responsável por criar um programa que, dada a lista de barras de ouro encontradas em cada igreja e o número mágico do professor, calcula rapidamente a resposta para o desafio.\n\nFormato da Entrada:\nA primeira linha contém dois inteiros: N, o número total de igrejas visitadas, e X, o número mágico de barras de ouro. A segunda linha contém N números inteiros, representando a quantidade de barras de ouro em cada uma das N igrejas.\n\nFormato da Saída:\nSeu programa deve imprimir um único número inteiro: a quantidade de igrejas que possuem exatamente X barras de ouro.",
				inputs: [
					'5 10\\n10 5 10 20 10',
					'3 7\\n1 2 3',
					'7 50\\n50 50 50 50 50 50 50',
					'1 15\\n15',
					'1 20\\n15',
					'10 25\\n25 1 2 3 4 5 6 7 8 25',
				],
				outputs: ['3', '0', '7', '1', '0', '2'],
			},
			{
				contestId: contest1.id,
				userId: user.id,
				title: 'Lucro Máximo na Estrada Real',
				difficulty: 'MEDIUM',
				description:
					'Um jovem tropeiro do século XVIII está planejando uma viagem por um trecho da Estrada Real, começando em Ouro Preto e passando por diversas vilas e cidades. Em cada localidade, ele pode realizar negócios que resultam em lucro (valores positivos) ou prejuízo (valores negativos), dependendo dos preços locais e dos impostos da Coroa Portuguesa. Ele quer descobrir qual o trecho *contínuo* de viagem (passando por uma ou mais cidades em sequência) lhe traria o maior lucro acumulado. Sua tarefa é criar um programa que analise a sequência de lucros e prejuízos das cidades e determine o valor do lucro máximo que o tropeiro pode obter em um único segmento contínuo da sua jornada.\n\nFormato da Entrada:\nA primeira linha contém um inteiro N, o número de cidades no trecho da Estrada Real. A segunda linha contém N inteiros, que podem ser positivos, negativos ou zero, representando o resultado financeiro em cada cidade da sequência.\n\nFormato da Saída:\nSeu programa deve imprimir um único número inteiro: o maior lucro possível em um trecho contínuo da viagem. Se todos os resultados forem negativos, a resposta deve ser o menor prejuízo (o maior valor, que será o mais próximo de zero).',
				inputs: [
					'8\\n-2 1 -3 4 -1 2 1 -5',
					'5\\n1 2 3 4 5',
					'5\\n-1 -2 -3 -4 -5',
					'1\\n10',
					'1\\n-5',
					'6\\n0 -1 5 0 -2 3',
					'10\\n-1 10 -5 8 -3 4 -10 2 3 5',
				],
				outputs: ['6', '15', '-1', '10', '-5', '6', '14'],
			},
			{
				contestId: contest1.id,
				userId: user.id,
				title: 'Festival de Inverno de Ouro Preto',
				difficulty: 'HARD',
				description:
					'Você foi contratado para ajudar na organização do famoso Festival de Inverno de Ouro Preto e Mariana. Sua principal responsabilidade é montar a programação de eventos para o palco principal. Você recebeu uma lista com todas as atrações candidatas, cada uma com seu horário de início e de término. Para otimizar o uso do espaço, você só pode agendar eventos que não se sobreponham. Ou seja, se um evento termina às 14h, o próximo só pode começar às 14h ou depois. Seu objetivo é criar um algoritmo que determine o número máximo de atrações que podem ser agendadas no palco principal, respeitando a regra de não sobreposição.\n\nFormato da Entrada:\nA primeira linha contém um inteiro N, representando o número total de atrações candidatas. As N linhas seguintes contêm, cada uma, dois inteiros: S (horário de início) e F (horário de fim) da atração.\n\nFormato da Saída:\nImprima um único número inteiro que representa a quantidade máxima de atrações que podem ser agendadas.',
				inputs: [
					'6\\n1 2\\n3 4\\n0 6\\n5 7\\n8 9\\n5 9',
					'3\\n10 20\\n12 15\\n20 30',
					'4\\n1 10\\n2 3\\n4 5\\n6 7',
					'4\\n1 2\\n3 4\\n5 6\\n7 8',
					'5\\n1 2\\n1 3\\n1 4\\n1 5\\n1 6',
					'5\\n1 10\\n2 10\\n3 10\\n4 10\\n5 10',
					'7\\n1 5\\n2 3\\n4 6\\n7 9\\n8 10\\n6 8\\n11 12',
				],
				outputs: ['4', '2', '3', '4', '1', '1', '4'],
			},
		],
	});
}

main()
	.then(async () => {
		await db.$disconnect();
		console.log('Seed completed successfully');
	})
	.catch(async (e) => {
		console.error(e);
		await db.$disconnect();
		process.exit(1);
	});
