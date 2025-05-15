import type { Contest, Prisma } from "@runner/db";
import { Pencil } from "lucide-react";
import type { Session } from "next-auth";
import Link from "next/link";
import { JoinButton } from "./join-button";

export function ContestHeader({
	contest,
	session,
}: {
	contest: Prisma.ContestGetPayload<{
		include: {
			UserOnContest: true;
		};
	}>;
	session: Session;
}) {
	const isCreatedByUser = contest.createdById === session.user.id;

	return (
		<div className="flex flex-col items-center">
			<div className="flex gap-2">
				<h1 className="font-bold text-3xl">{contest.name}</h1>
				{isCreatedByUser && (
					<Link href={`${contest.id}/edit`}>
						<Pencil size={18} />
					</Link>
				)}
			</div>
			<JoinButton
				contest={contest}
				session={session}
				isCreatedByUser={isCreatedByUser}
			/>
		</div>
	);
}
