import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { UserRole } from "@/drizzle/schema";
import { unwrap } from "@/lib/action-result";
import { listAllClasses } from "@/lib/actions/admin/list-all-classes";
import { listAllContests } from "@/lib/actions/admin/list-all-contests";
import { listUsers } from "@/lib/actions/admin/list-users";
import { setUserRole } from "@/lib/actions/admin/set-user-role";
import type { AdminListParams } from "@/lib/admin/list-params";

export const useAdminContests = (params: AdminListParams) =>
  useQuery({
    queryKey: ["admin", "contests", params],
    queryFn: () => listAllContests(params),
    placeholderData: keepPreviousData,
  });

export const useAdminClasses = (params: AdminListParams) =>
  useQuery({
    queryKey: ["admin", "classes", params],
    queryFn: () => listAllClasses(params),
    placeholderData: keepPreviousData,
  });

export const useAdminUsers = (params: AdminListParams) =>
  useQuery({
    queryKey: ["admin", "users", params],
    queryFn: () => listUsers(params),
    placeholderData: keepPreviousData,
  });

export const useSetUserRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { userId: string; role: UserRole }) =>
      unwrap(await setUserRole(input)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
};
