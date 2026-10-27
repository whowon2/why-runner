import { useQuery } from "@tanstack/react-query";
import { retryUnlessActionError, unwrap } from "@/lib/action-result";
import { getClassGradebook } from "@/lib/actions/classes/get-class-gradebook";

export const classGradebookKey = (classroomId: string) => [
  "classes",
  classroomId,
  "gradebook",
];

export const useClassGradebook = (classroomId: string) =>
  useQuery({
    queryKey: classGradebookKey(classroomId),
    queryFn: async () => unwrap(await getClassGradebook(classroomId)),
    retry: retryUnlessActionError,
  });
