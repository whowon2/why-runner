import { db } from '@/server/db';

async function main() {
	await db.contest.deleteMany();
	await db.problem.deleteMany();
	await db.user.deleteMany({
		where: {
			email: {
				contains: 'user',
			},
		},
	});
	await db.submission.deleteMany();
	await db.userOnContest.deleteMany();

	const user = await db.user.create({
		data: {
			email: 'user@email.com',
			name: 'User Test',
		},
	});

	const user2 = await db.user.create({
		data: {
			email: 'user2@email.com',
			name: 'Super User',
		},
	});

	// Contest 1
	const contest1 = await db.contest.create({
		data: {
			createdById: user.id,
			end: new Date(Date.now() + 60 * 1000 * 60), // 60 minutes of duration
			name: 'Maraton 2023', // Longer duration
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
			{
				contestId: contest1.id,
				description: `
Given an integer array nums, move all 0's to the end of it while maintaining the relative order of the non-zero elements.
Note that you must do this in-place without making a copy of the array.`,
				difficulty: 'EASY',
				inputs: ['0 1 0 3 12', '0', '1 0'],
				outputs: ['1 3 12 0 0', '0', '1 0'],
				title: 'Move Zeroes',
				userId: user.id,
				public: true,
			},
			{
				contestId: contest1.id,
				description:
					'Given an array nums of n integers where nums[i] is in the range [1, n], return an array of all the integers in the range [1, n] that do not appear in nums.',
				difficulty: 'EASY',
				inputs: ['4 3 2 7 8 2 3 1', '1 1'],
				outputs: ['5 6', '2'],
				title: 'Find All Numbers Disappeared in an Array',
				userId: user.id,
				public: true,
			},
			{
				contestId: contest1.id,
				description:
					'Given the head of a singly linked list, reverse the list, and return the reversed list.',
				difficulty: 'EASY',
				inputs: ['1 2 3 4 5', '1 2'],
				outputs: ['5 4 3 2 1', '2 1'],
				title: 'Reverse Linked List',
				userId: user.id,
				public: true,
			},
			{
				contestId: contest1.id,
				description: `Given a string s, return true if it is a palindrome, false otherwise.
              A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.`,
				difficulty: 'EASY',
				inputs: ['A man, a plan, a canal: Panama', 'race a car', ' '],
				outputs: ['true', 'false', 'true'],
				title: 'Valid Palindrome',
				userId: user.id,
				public: true,
			},
			{
				contestId: contest1.id,
				description: `Given a non-negative integer x, compute and return the square root of x.
              Since the return type is an integer, the decimal digits are truncated, and only the integer part of the result is returned.`,
				difficulty: 'EASY',
				inputs: ['4', '8', '0'],
				outputs: ['2', '2', '0'],
				title: 'Sqrt(x)',
				userId: user.id,
				public: true,
			},
			{
				contestId: contest1.id,
				description: `You are given a m x n grid. You can only move either down or right at any point in time. Your goal is to reach the bottom-right corner of the grid (i.e., grid[m-1][n-1]).
              Return the number of unique paths to reach the bottom-right corner.`,
				difficulty: 'MEDIUM',
				inputs: ['3\n7', '3\n2', '7\n3'],
				outputs: ['28', '3', '28'], // m \n n
				title: 'Unique Paths',
				userId: user.id,
				public: true,
			},
			{
				contestId: contest1.id,
				description:
					'Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.',
				difficulty: 'MEDIUM',
				inputs: ['1 3,2 6,8 10,15 18', '1 4,4 5'],
				outputs: ['1 6,8 10,15 18', '1 5'],
				title: 'Merge Intervals',
				userId: user.id,
				public: true,
			},
			{
				contestId: contest1.id,
				description:
					'Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, and j != k, and nums[i] + nums[j] + nums[k] == 0.',
				difficulty: 'MEDIUM',
				inputs: ['-1 0 1 2 -1 -4', '0 1 1', '0 0 0'],
				outputs: ['-1 -1 2\n-1 0 1', '', '0 0 0'],
				title: '3Sum', // Output order of triplets/elements within triplets can vary
				userId: user.id,
				public: true,
			},
			{
				contestId: contest1.id,
				description:
					'Given n pairs of parentheses, write a function to generate all combinations of well-formed parentheses.',
				difficulty: 'MEDIUM',
				inputs: ['3', '1'],
				outputs: ['((()))\n(()())\n(())()\n()(())\n()()()', '()'],
				title: 'Generate Parentheses', // Order can vary
				userId: user.id,
				public: true,
			},
			{
				contestId: contest1.id,
				description:
					'Given a collection of distinct integers, return all possible permutations. You can return the answer in any order.',
				difficulty: 'MEDIUM',
				inputs: ['1 2 3', '0 1'],
				outputs: ['1 2 3\n1 3 2\n2 1 3\n2 3 1\n3 1 2\n3 2 1', '0 1\n1 0'],
				title: 'Permutations', // Order can vary
				userId: user.id,
				public: true,
			},
			{
				contestId: contest1.id,
				description:
					'Given a non-empty array of integers nums, every element appears three times except for one, which appears exactly once. Find that single one.',
				difficulty: 'MEDIUM',
				inputs: ['2 2 3 2', '0 1 0 1 0 1 99'],
				outputs: ['3', '99'],
				title: 'Single Number II',
				userId: user.id,
				public: true,
			},
		],
	});

	await db.userOnContest.create({
		data: {
			contestId: contest1.id,
			userId: user.id,
			answers: [
				'A',
				'B',
				'C',
				'D',
				'E',
				'F',
				'G',
				'H',
				'I',
				'J',
				'K',
				'L',
				'M',
				'N',
			],
		},
	});

	await db.userOnContest.create({
		data: {
			contestId: contest1.id,
			userId: user2.id,
			answers: ['A', 'B', 'C', 'I', 'J', 'L', 'M', 'N'],
		},
	});

	// Contest 2
	const contest2 = await db.contest.create({
		data: {
			createdById: user.id,
			end: new Date(Date.now() + 86400000 * 14), // Starts in 7 days
			name: 'Algorithmic Challenges May 2025', // Ends in 14 days
			start: new Date(Date.now() + 86400000 * 7),
		},
	});

	await db.problem.createManyAndReturn({
		data: [
			{
				contestId: contest2.id,
				description: `Implement the myAtoi(string s) function, which converts a string to a 32-bit signed integer (similar to C/C++'s atoi function).`,
				difficulty: 'MEDIUM',
				inputs: ['42', '   -42', '4193 with words'],
				outputs: ['42', '-42', '4193'],
				title: 'String to Integer (atoi)',
				userId: user.id,
			},
			{
				contestId: contest2.id,
				description:
					'Given a linked list, remove the n-th node from the end of list and return its head.',
				difficulty: 'MEDIUM',
				inputs: ['1 2 3 4 5\n2', '1\n1', '1 2\n1'],
				outputs: ['1 2 3 5', '', '1'],
				title: 'Remove Nth Node From End of List',
				userId: user.id,
			},
		],
	});

	// Contest 3
	const contest3 = await db.contest.create({
		data: {
			createdById: user.id,
			end: new Date(Date.now() + 86400000 * 45), // Starts in 30 days
			name: 'Data Structures Tournament June 2025', // Ends in 45 days
			start: new Date(Date.now() + 86400000 * 30),
		},
	});

	await db.problem.createManyAndReturn({
		data: [
			{
				contestId: contest3.id,
				description:
					'Given a non-empty array of integers nums, every element appears twice except for one. Find that single one.',
				difficulty: 'EASY',
				inputs: ['2 2 1', '4 1 2 1 2'],
				outputs: ['1', '4'],
				title: 'Single Number',
				userId: user.id,
			},
			{
				contestId: contest3.id,
				description:
					'Given an array of integers, find if the array contains any duplicates.',
				difficulty: 'EASY',
				inputs: ['1 2 3 1', '1 2 3 4', '1 1 1 3 3 4 3 2 4 2'],
				outputs: ['true', 'false', 'true'],
				title: 'Contains Duplicate',
				userId: user.id,
			},
			{
				contestId: contest3.id,
				description: `You are a professional robber planning to rob houses along a street. Each house has a certain amount of money stashed, the only constraint stopping you from robbing each of them is that adjacent houses have security systems connected and it will automatically contact the police if two adjacent houses were broken into on the same night.
        Given an integer array nums representing the amount of money of each house, return the maximum amount of money you can rob tonight without alerting the police.`,
				difficulty: 'MEDIUM',
				inputs: ['1 2 3 1', '2 7 9 3 1'],
				outputs: ['4', '12'],
				title: 'House Robber',
				userId: user.id,
			},
		],
	});
}

main()
	.then(async () => {
		await db.$disconnect();
	})
	.catch(async (e) => {
		console.error(e);
		await db.$disconnect();
		process.exit(1);
	});
