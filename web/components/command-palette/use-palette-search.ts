"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { getContests } from "@/lib/actions/contest/get-contests";
import { getProblems } from "@/lib/actions/problems/get-problems";

const MIN_LENGTH = 2;
const DEBOUNCE_MS = 250;
const RESULT_LIMIT = 5;

// Problems/contests matching the palette input. Both actions need a session,
// so callers pass `enabled: false` when signed out.
export function usePaletteSearch(search: string, enabled: boolean) {
  const [term, setTerm] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => setTerm(search.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [search]);

  const active = enabled && term.length >= MIN_LENGTH;

  const problems = useQuery({
    queryKey: ["problems", { page: 1, pageSize: RESULT_LIMIT, search: term }],
    queryFn: () =>
      getProblems({ page: 1, pageSize: RESULT_LIMIT, search: term }),
    enabled: active,
  });

  const contests = useQuery({
    queryKey: ["contests", { page: 1, pageSize: RESULT_LIMIT, search: term }],
    queryFn: () =>
      getContests({ page: 1, pageSize: RESULT_LIMIT, search: term }),
    enabled: active,
  });

  return {
    term: active ? term : "",
    problems: active ? (problems.data?.data ?? []) : [],
    contests: active ? (contests.data?.data ?? []) : [],
  };
}
