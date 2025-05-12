import type { Contest } from "@runner/db";
import type { Session } from "next-auth";

export function EditContestPage({
	contest,
	session,
}: { contest: Contest; session: Session }) {
	return (
		<div>
			<p>Edit contest {contest.id}</p>
		</div>
	);
}
