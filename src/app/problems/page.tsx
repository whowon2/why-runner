import { auth } from "@/server/auth";
import { api } from "@/trpc/server";
import { redirect } from "next/navigation";
import { BreadCrumbs } from "../_components/breadcrumbs";
import { ProblemsList } from "../_components/problems/list";

export default async function ProblemsPage() {
	const session = await auth();

	if (!session) {
		redirect("/api/auth/signin");
	}

	const problems = await api.problem.getAll({});

	return (
		<div className="flex w-full flex-col items-center justify-center gap-8 p-8">
			<BreadCrumbs />
			<ProblemsList problems={problems} />
		</div>
	);
}
