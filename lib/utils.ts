import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Problem } from "./db/schema";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isProblemSolved(problemId: number, solved: Problem[]) {
  return solved.some((p) => p.id === problemId);
}
