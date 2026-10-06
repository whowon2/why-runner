import { headers } from "next/headers";
import {
  PATHNAME_HEADER,
  safeRedirectPath,
  stripLocale,
} from "./redirect-path";

// Path (without locale prefix) of the page currently being rendered, as
// recorded by proxy.ts. Null when unavailable.
export async function getCurrentPath() {
  const path = (await headers()).get(PATHNAME_HEADER);
  if (!path) return null;
  return safeRedirectPath(stripLocale(path));
}
