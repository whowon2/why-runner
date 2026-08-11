import { useQuery } from "@tanstack/react-query";
import { getClass } from "@/lib/actions/classes/get-class";

export const useClass = (classroomId: string) =>
  useQuery({
    queryKey: ["classes", classroomId],
    queryFn: () => getClass(classroomId),
  });
