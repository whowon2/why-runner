import { useQuery } from "@tanstack/react-query";
import { listMyClasses } from "@/lib/actions/classes/list-my-classes";

export const useMyClasses = () =>
  useQuery({
    queryKey: ["classes"],
    queryFn: () => listMyClasses(),
  });
