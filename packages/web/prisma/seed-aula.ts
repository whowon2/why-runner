import { db } from '@/server/db';

async function main() {
	const user = await db.user.findUnique({
		where: { email: 'whowonbtw@gmail.com' },
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
				description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.
You may assume that each input would have exactly one solution, and you may not use the same element twice.
You can return the answer in any order.`,
				difficulty: 'EASY',
				inputs: ['2 7 11 15\n9', '3 2 4\n6', '1 2\n3'],
				outputs: ['0 1', '1 2', '0 1'],
				title: 'Two Sum',
				userId: user.id,
				public: true,
			},
			{
				contestId: contest1.id,
				description:
					'Given a string s, find the length of the longest substring without repeating characters.',
				difficulty: 'MEDIUM',
				inputs: ['abcabcbb', 'bbbbb', 'pwwkew'],
				outputs: ['3', '1', '3'],
				title: 'Longest Substring Without Repeating Characters',
				userId: user.id,
				public: true,
			},
			{
				contestId: contest1.id,
				description: `
Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays.
The overall run time complexity should be O(log (m+n)).`,
				difficulty: 'HARD',
				inputs: ['1 3\n2', '1 2\n3 4'],
				outputs: ['2.00000', '2.50000'],
				title: 'Median of Two Sorted Arrays',
				userId: user.id,
				public: true,
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
