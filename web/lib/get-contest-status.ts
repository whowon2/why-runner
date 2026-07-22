export function getContestStatus(
  start: Date | null,
  end: Date | null,
  now: Date,
) {
  if (!start || !end) {
    return {
      badge: "draft" as const,
      color:
        "text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20",
      gradient: "from-indigo-500 to-violet-400",
    };
  }
  if (now < new Date(start)) {
    return {
      badge: "upcoming" as const,
      color:
        "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20",
      gradient: "from-emerald-500 to-teal-400",
    };
  }
  if (new Date(start) <= now && now <= new Date(end)) {
    return {
      badge: "active" as const,
      color:
        "text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-500 border-amber-200 dark:border-amber-500/20",
      gradient: "from-amber-500 to-orange-400",
    };
  }
  return {
    badge: "past" as const,
    color:
      "text-neutral-600 bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700",
    gradient: "from-neutral-400 to-neutral-500",
  };
}
