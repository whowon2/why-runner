import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { isSurveyAdmin } from "@/lib/surveys/admin";
import { SurveyResults } from "../_components/survey-results";

export default async function SurveyResultsPage() {
  const user = await requireUser({ redirectTo: "/auth/signin" });
  if (!(await isSurveyAdmin(user))) notFound();

  return (
    <div className="flex w-full flex-1 flex-col items-center gap-4 p-4">
      <SurveyResults />
    </div>
  );
}
