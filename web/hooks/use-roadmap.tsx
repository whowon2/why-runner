import { useQuery } from "@tanstack/react-query";
import { getRoadmap } from "@/lib/actions/lessons/get-roadmap";

export const useRoadmap = () =>
  useQuery({
    queryKey: ["roadmap"],
    queryFn: () => getRoadmap(),
  });
