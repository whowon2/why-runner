export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function generateSlug(input: string): string {
  const base = slugify(input) || "item";
  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  return `${base}-${suffix}`;
}
