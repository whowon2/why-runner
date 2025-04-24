import { Prisma, Problem } from "@repo/db";
import { BACKEND_URL } from "../constants";

async function getAll(): Promise<Problem[]> {
	const res = await fetch(`${BACKEND_URL}/problems`);
	return await res.json();
}

async function create(problem: Prisma.ProblemCreateInput) {
	const res = await fetch(`${BACKEND_URL}/problems`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(problem),
	});

	return await res.json();
}

async function find(id: string): Promise<Prisma.ProblemGetPayload<{
	include: {
		submissions: true;
	};
}> | null> {
	const res = await fetch(`${BACKEND_URL}/problems/${id}`);

	return await res.json();
}

export const problemsService = {
	getAll,
	create,
	find,
};
