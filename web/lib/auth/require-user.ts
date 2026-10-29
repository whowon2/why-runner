import { getCurrentUser } from "./get-current-user";

/** Page guard: requires a session, else redirects (e.g. to sign-in). */
export async function requireUser({ redirectTo }: { redirectTo?: string }) {
  return getCurrentUser({ redirectTo });
}
