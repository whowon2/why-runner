import { getCurrentUser } from "@/lib/auth/get-current-user";
import { NewProblem } from "../_components/create";

export default async function Page() {
  await getCurrentUser({ redirectTo: "/auth/signin" });

  return (
    <div>
      <NewProblem />
    </div>
  );
}
