import type { Prisma } from "@prisma/client";

export function DescriptionTab({
	contest,
}: {
	contest: Prisma.ContestGetPayload<{
		include: {
			problems: true;
			userOnContest: true;
		};
	}>;
}) {
	return (
		<div>
			<div className="flex gap-2">
				<p>Starts at: </p>
				{new Intl.DateTimeFormat("en-US", {
					dateStyle: "medium",
					timeStyle: "short",
				}).format(contest.start)}
			</div>
			<div className="flex gap-2">
				<p>Ends at: </p>
				{new Intl.DateTimeFormat("en-US", {
					dateStyle: "medium",
					timeStyle: "short",
				}).format(contest.end)}
			</div>
			<div>Participants: {contest.userOnContest.length}</div>
			<div>Problems: {contest.problems.length}</div>
		</div>
	);
}
