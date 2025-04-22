import { Problem } from "@repo/db";
import { BACKEND_URL } from "../constants";

export async function getAllProblems(): Promise<Problem[]> {
  const res = await fetch(`${BACKEND_URL}/problems`);
  return await res.json();
}
