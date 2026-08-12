import { useQuery } from "@tanstack/react-query";
import { listClassLessons } from "@/lib/actions/lessons/list-lessons";

export const useClassLessons = (classroomId: string) =>
  useQuery({
    queryKey: ["classes", classroomId, "lessons"],
    queryFn: () => listClassLessons(classroomId),
  });
