import { Button } from "@/components/ui/button";
import { auth } from "@/server/auth";
import Link from "next/link";
import { AvatarButton } from "./avatar-button";
import { ModeToggle } from "./theme";

export async function Header() {
  const session = await auth();

  return (
    <header className="flex items-center justify-between border-b p-4">
      <Link href={"/"}>
        <h1 className="font-bold text-blue-600 text-xl">Why Runner</h1>
      </Link>
      <div className="flex gap-4 items-center justify-center">
        {session ? (
          <AvatarButton session={session} />
        ) : (
          <Link href="/api/auth/signin" className="text-blue-500">
            <Button variant="outline">Login</Button>
          </Link>
        )}
        <ModeToggle />
      </div>
    </header>
  );
}
