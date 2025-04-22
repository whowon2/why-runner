import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ModeToggle } from "./theme";
import { AvatarButton } from "./avatar-button";

export async function Header() {
  const session = {
    user: {
      name: "John Doe",
      email: "john.doe@example.com",
      image: "https://example.com/avatar.jpg",
    },
  };

  return (
    <header className="flex justify-between w-full items-center border-b p-4">
      <Link href={"/"}>
        <h1 className="text-xl font-bold text-blue-600">Why Runner</h1>
      </Link>
      <div className="flex gap-4 ">
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
