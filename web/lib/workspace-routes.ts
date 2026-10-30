/**
 * Pages rendered in the fullscreen editor workspace shell
 * (`components/workspace/`), which hide the site dock and footer. Add every
 * new editor route here. Paths are locale-less (next-intl's `usePathname`).
 *
 * Pure module: runs in `bun test`.
 */
export function isWorkspacePath(pathname: string): boolean {
  const s = pathname.split("/").filter(Boolean);
  // /problems/[slug]
  if (s.length === 2 && s[0] === "problems") return s[1] !== "new";
  // /contests/[slug]/problems/[problemSlug]
  if (s.length === 4 && s[0] === "contests" && s[2] === "problems") {
    return true;
  }
  // /classes/[classSlug]/lessons/[lessonSlug]/exercises/[exerciseSlug]
  return (
    s.length === 6 &&
    s[0] === "classes" &&
    s[2] === "lessons" &&
    s[4] === "exercises"
  );
}
