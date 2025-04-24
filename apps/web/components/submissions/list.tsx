import { Submission } from "@repo/db";

export function SubmissionList({ submissions }: { submissions: Submission[] }) {
  return (
    <div className="flex gap-4 justify-between border rounded-md p-4 bg-white shadow-sm">
      {submissions.length > 0 ? (
        <div>
          {submissions.map((submission) => (
            <div key={submission.id} className="flex flex-col">
              <p className="text-sm">{submission.status}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm">No submissions found.</p>
      )}
    </div>
  );
}
