import { requireUser } from "@/lib/auth/require-user";
import { SurveyHub } from "./_components/survey-hub";

export default async function SurveysPage() {
  await requireUser({ redirectTo: "/auth/signin" });

  return (
    <div className="flex w-full flex-1 flex-col items-center gap-4 p-4">
      <SurveyHub />
    </div>
  );
}
