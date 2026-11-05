import type { QueryClient } from "@tanstack/react-query";

/**
 * A membership change (student ↔ co-teacher, removal) changes who counts as
 * a student everywhere: class detail and list counts, gradebook, lesson
 * lists (`["classes"]` prefix), lesson reviews and exercise similarity.
 * It also changes the membership badges in the "Add co-teacher" search.
 */
export function invalidateClassRoster(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ["classes"] });
  queryClient.invalidateQueries({ queryKey: ["lessons"] });
  queryClient.invalidateQueries({ queryKey: ["exercises"] });
  queryClient.invalidateQueries({ queryKey: ["co-teacher-search"] });
}
