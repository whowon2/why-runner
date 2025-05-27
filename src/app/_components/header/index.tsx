import { Button } from "@/components/ui/button";
import { auth } from "@/server/auth";
import Link from "next/link";
import { AvatarButton } from "./avatar-button";

export async function Header() {
  const session = await auth();

  return (
    <div className="sticky flex items-center justify-between p-4">
      {session ? (
        <AvatarButton session={session} />
      ) : (
        <Link href={"/api/auth/signin"}>
          <Button>Login</Button>
        </Link>
      )}
    </div>
  );
}
