import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { BreadCrumbs } from "../_components/breadcrumbs";
import Profile from "../_components/profile";

export default async function ProfilePage() {
	const session = await auth();

	if (!session) {
		redirect("/auth/signin?callbackUrl=profile");
	}

	return (
		<div className="flex w-full flex-col items-center justify-center p-4">
			<BreadCrumbs />
			<Profile session={session} />
		</div>
	);
}
