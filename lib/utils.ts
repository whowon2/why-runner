import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Problem } from "@/drizzle/schema";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isProblemSolved(problemId: string, solved: Problem[]) {
  return solved.some((p) => String(p.id) === problemId);
}
