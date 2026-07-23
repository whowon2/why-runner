export const LEGAL_SLUGS = {
  terms: "/terms",
  privacy: "/privacy",
  cookies: "/cookies",
  guidelines: "/community-guidelines",
  copyright: "/copyright",
  moderation: "/moderation",
} as const;

export type LegalSlugKey = keyof typeof LEGAL_SLUGS;
