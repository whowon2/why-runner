import { getCurrentUser } from "@/lib/auth/get-current-user";
import { FeedTabs } from "./_components/feed-tabs";

export default async function FeedPage() {
  await getCurrentUser({ redirectTo: "/auth/signin" });

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8">
      <FeedTabs />
    </div>
  );
}
