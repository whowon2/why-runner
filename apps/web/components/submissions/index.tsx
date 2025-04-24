import { Problem, Submission } from "@repo/db";
import { UploadSubmission } from "./upload";
import { SubmissionList } from "./list";

export const SubmissionSection = ({
  problem,
  submissions,
}: {
  problem: Problem;
  submissions: Submission[];
}) => {
  return (
    <div className="gap-4 flex flex-col w-full">
      <h1 className="font-bold">Submissions</h1>
    </div>
  );
};
