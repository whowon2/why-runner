import { getCurrentUser } from "@/lib/auth/get-current-user";
import { FeedTabs } from "./_components/feed-tabs";

export default async function FeedPage() {
  await getCurrentUser({ redirectTo: "/auth/signin" });

  return (
    <div className="flex w-full flex-1 flex-col items-center gap-4 p-4">
      <FeedTabs />
    </div>
  );
}
