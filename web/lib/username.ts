import { z } from "zod";

export const usernameSchema = z
  .string()
  .min(3)
  .max(20)
  .regex(/^[A-Za-z0-9.-]+$/, "Username must be letters, numbers, . or -");

/** RA (Registro do Aluno): the 7-digit IFMG student ID, leading zeros kept. */
export const raSchema = z
  .string()
  .trim()
  .regex(/^\d{7}$/, "RA must be exactly 7 digits");

/** Optional RA input: blank clears it (null). */
export const optionalRaSchema = z
  .string()
  .trim()
  .transform((v) => v || null)
  .pipe(raSchema.nullable());

/** Form field: blank or a valid RA (the server maps blank to null). */
export const raFieldSchema = z.union([z.string().trim().length(0), raSchema]);

/** Matches a username that is really an RA (see the RA field hint). */
export const looksLikeRa = (value: string) => /^\d{7}$/.test(value);

export function generateUsername(seed: string): string {
  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const base = (seed.toLowerCase().replace(/[^a-z0-9.]+/g, "") || "user").slice(
    0,
    20 - suffix.length - 1,
  );
  return `${base}-${suffix}`;
}
