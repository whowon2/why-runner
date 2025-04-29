import type { Team } from "@prisma/client";

export function CardTeam({ team }: { team: Team }) {
	return <div>{team.name}</div>;
}
