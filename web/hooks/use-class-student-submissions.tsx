import { useQuery } from "@tanstack/react-query";
import { retryUnlessActionError, unwrap } from "@/lib/action-result";
import { getClassStudentSubmissions } from "@/lib/actions/classes/get-class-student-submissions";

// Under the `["classes"]` prefix, so roster changes (`invalidateClassRoster`)
// and any other class-wide invalidation refresh it too.
export const classStudentSubmissionsKey = (
  classroomId: string,
  userId: string,
) => ["classes", classroomId, "students", userId, "submissions"];

export const useClassStudentSubmissions = (
  classroomId: string,
  userId: string | null,
) =>
  useQuery({
    queryKey: classStudentSubmissionsKey(classroomId, userId ?? ""),
    queryFn: async () =>
      unwrap(await getClassStudentSubmissions(classroomId, userId as string)),
    enabled: !!userId,
    retry: retryUnlessActionError,
  });
