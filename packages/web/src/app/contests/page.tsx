import { ContestList } from "@/components/contests/contest-list";
import { auth } from "@/server/auth";
import { redirect } from "next/navigation";

export default async function ContestsPage() {
	const session = await auth();

	if (!session) {
		redirect("/api/auth/signin");
	}

	return (
		<div className="">
			<ContestList />
		</div>
	);
}
