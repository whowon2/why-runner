"use client";

import { api } from "@/trpc/react";
import { CardTeam } from "./card";

export function ListTeams({ query }: { query: string }) {
	const { data: teams } = api.team.getTeams.useQuery({
		query,
	});

	return (
		<div>
			<h1>Teams</h1>
			<p>Query: {query}</p>
			<p>Count: {teams?.length}</p>
			<ul>
				{teams?.map((team) => (
					<CardTeam key={team.id} team={team} />
				))}
			</ul>
		</div>
	);
}
