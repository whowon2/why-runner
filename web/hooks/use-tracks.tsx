import { useQuery } from "@tanstack/react-query";
import { listClassTracks } from "@/lib/actions/lessons/list-tracks";

export const useClassTracks = (classroomId: string) =>
  useQuery({
    queryKey: ["classes", classroomId, "tracks"],
    queryFn: () => listClassTracks(classroomId),
  });
