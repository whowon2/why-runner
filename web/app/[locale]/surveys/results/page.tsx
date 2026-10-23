import { notFound } from "next/navigation";
import { requireOnboardedUser } from "@/lib/auth/require-onboarded-user";
import { isSurveyAdmin } from "@/lib/surveys/admin";
import { SurveyResults } from "../_components/survey-results";

export default async function SurveyResultsPage() {
  const user = await requireOnboardedUser({ redirectTo: "/auth/signin" });
  if (!isSurveyAdmin(user)) notFound();

  return (
    <div className="flex w-full flex-1 flex-col items-center gap-4 p-4">
      <SurveyResults />
    </div>
  );
}
