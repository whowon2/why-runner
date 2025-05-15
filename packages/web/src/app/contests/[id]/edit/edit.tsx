import { EditContestForm } from "@/components/contests/edit/edit-contest-form";
import { EditContestProblems } from "@/components/contests/edit/edit-contest-problems";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Prisma } from "@runner/db";
import type { Session } from "next-auth";

export function EditContest({
	contest,
	session,
}: {
	contest: Prisma.ContestGetPayload<{
		include: {
			Problems: true;
		};
	}>;
	session: Session;
}) {
	return (
		<div className="flex w-full flex-col gap-4 p-4">
			<Card>
				<CardHeader>
					<CardTitle>Contest</CardTitle>
				</CardHeader>
				<CardContent>
					<EditContestForm contest={contest} />
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle>Problems</CardTitle>
				</CardHeader>
				<CardContent>
					<EditContestProblems contest={contest} />
				</CardContent>
			</Card>
		</div>
	);
}
