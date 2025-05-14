import { Card, CardContent } from "@/components/ui/card";
import type { Prisma } from "@runner/db";

export function ContestDescription({
	contest,
}: {
	contest: Prisma.ContestGetPayload<{
		include: { UserOnContest: true; Problems: true };
	}>;
}) {
	return (
		<Card className="w-full">
			<CardContent>
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
				<div>Participants: {contest.UserOnContest.length}</div>
				<div>Problems: {contest.Problems.length}</div>
			</CardContent>
		</Card>
	);
}
