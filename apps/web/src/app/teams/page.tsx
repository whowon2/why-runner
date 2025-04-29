import { Suspense } from "react";
import { FilterTeams } from "../_components/teams/filter";
import { ListTeams } from "../_components/teams/list";

export default async function TeamPage(props: {
	searchParams?: Promise<{
		query?: string;
		page?: string;
	}>;
}) {
	const searchParams = await props.searchParams;
	const query = searchParams?.query ?? "";
	// const currentPage = Number(searchParams?.page) || 1;

	return (
		<div className="flex h-full min-h-screen flex-1">
			<aside className="flex h-full min-h-screen border-r bg-red-200">
				<FilterTeams />
			</aside>
			<main className="flex flex-col gap-4 p-8">
				<h1 className="font-bold text-xl">Teams</h1>
				<Suspense fallback={<div>Loading...</div>}>
					<ListTeams query={query} />
				</Suspense>
			</main>
		</div>
	);
}
