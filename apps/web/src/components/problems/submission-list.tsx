import type { Submission } from "@repo/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SubmissionList({ submissions }: { submissions: Submission[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Submissions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
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
      </CardContent>
    </Card>
  );
}
