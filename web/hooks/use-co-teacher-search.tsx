import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { searchCoTeacherCandidates } from "@/lib/actions/classes/search-co-teacher-candidates";

export const CO_TEACHER_SEARCH_MIN_LENGTH = 2;

/** Debounced (250 ms) owner-only user search for the "Add co-teacher" combobox. */
export const useCoTeacherSearch = (classroomId: string, query: string) => {
  const [debouncedQuery, setDebouncedQuery] = useState(query.trim());
  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => clearTimeout(timeout);
  }, [query]);

  const enabled =
    debouncedQuery.replace(/^@/, "").length >= CO_TEACHER_SEARCH_MIN_LENGTH;

  const result = useQuery({
    queryKey: ["co-teacher-search", classroomId, debouncedQuery],
    queryFn: () =>
      searchCoTeacherCandidates({ classroomId, query: debouncedQuery }),
    enabled,
    placeholderData: keepPreviousData,
  });

  return { ...result, enabled, isDebouncing: debouncedQuery !== query.trim() };
};
