import { auth } from "@/server/auth";
import Profile from "./profile";
import { redirect } from "next/navigation";

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
