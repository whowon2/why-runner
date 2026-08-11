import { requireOnboardedUser } from "@/lib/auth/require-onboarded-user";
import { ClassList } from "./_components/class-list";

export default async function ClassesPage() {
  await requireOnboardedUser({ redirectTo: "/auth/signin" });

  return (
    <div className="flex w-full flex-1 flex-col items-center gap-4 p-4">
      <div className="w-full max-w-5xl mx-auto flex-1 flex flex-col gap-4 py-8">
        <ClassList />
      </div>
    </div>
  );
}
