import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { auth } from "@/server/auth";
import { AvatarButton } from "./avatar-button";

export async function Header() {
	const session = await auth();

	return (
		<div className="sticky flex items-center justify-between p-4">
			{session ? <AvatarButton session={session} /> : <div>login</div>}
		</div>
	);
}
