import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import Profile from "./profile";

export default async function ProfilePage() {
	const session = await auth();

	if (!session) {
		redirect("/auth/signin?callbackUrl=profile");
	}

	return (
		<div className="p-8">
			<Profile session={session} />
		</div>
	);
}
