import type { Submission } from "@repo/db";

export function SubmissionList({ submissions }: { submissions: Submission[] }) {
  return (
    <div className="flex justify-between gap-4 rounded-md border bg-white p-4 shadow-sm">
      {submissions.length > 0 ? (
        <div>
          {submissions.map((submission) => (
            <div key={submission.id} className="flex flex-col">
              <p className="text-sm">{submission.status}</p>
              <p className="text-xs text-gray-500">{submission.output}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm">No submissions found.</p>
      )}
    </div>
  );
}
