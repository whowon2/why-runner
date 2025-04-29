import { auth } from "@/server/auth";
import Profile from "./profile";

export default async function ProfilePage() {
	const session = await auth();

	console.log(session);

	return (
		<div className="flex p-8">
			<h1>Profile</h1>
			<Profile />
		</div>
	);
}
