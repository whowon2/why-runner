import { updateUserPreferences } from "@/lib/actions/preferences/update-preferences";
import {
  type PreferenceKey,
  type PreferencesPatch,
  preferencesPatchSchema,
} from "@/lib/preferences";

/**
 * Browser side of the account settings: every setting keeps its own local
 * store (read synchronously, mirrored in localStorage) and is bound here so
 * the account's stored values can be applied to it and its local value read
 * for seeding. Committed changes go through `savePreference`, which batches
 * them into one debounced save while an account is connected.
 */

type Value<K extends PreferenceKey> = NonNullable<PreferencesPatch[K]>;

type Binding<K extends PreferenceKey> = {
  /** The value this browser has stored, or undefined if none. */
  readLocal: () => Value<K> | undefined;
  /** Shows a value from the account and stores it locally (not saved back). */
  apply: (value: Value<K>) => void;
};

type Account = {
  onSaved: (patch: PreferencesPatch) => void;
  onError: () => void;
};

const SAVE_DELAY_MS = 500;

const bindings = new Map<PreferenceKey, Binding<PreferenceKey>>();
// Changed in this page since load; the account's older values don't replace
// them.
const dirty = new Set<PreferenceKey>();
let account: Account | null = null;
let pending: PreferencesPatch = {};
let timer: ReturnType<typeof setTimeout> | undefined;

export function bindPreference<K extends PreferenceKey>(
  key: K,
  binding: Binding<K>,
) {
  const stored = binding as unknown as Binding<PreferenceKey>;
  bindings.set(key, stored);
  return () => {
    if (bindings.get(key) === stored) bindings.delete(key);
  };
}

export function savePreference(patch: PreferencesPatch) {
  for (const key of Object.keys(patch) as PreferenceKey[]) dirty.add(key);
  if (!account) return;
  pending = { ...pending, ...patch };
  clearTimeout(timer);
  timer = setTimeout(flushPreferences, SAVE_DELAY_MS);
}

export async function flushPreferences() {
  clearTimeout(timer);
  timer = undefined;
  const target = account;
  const patch = pending;
  pending = {};
  if (!target || Object.keys(patch).length === 0) return;

  try {
    await updateUserPreferences(patch);
    target.onSaved(patch);
  } catch {
    target.onError();
  }
}

/** Starts saving changes to the signed-in account; returns the disconnect. */
export function connectPreferences(next: Account) {
  account = next;
  const onPageHide = () => void flushPreferences();
  window.addEventListener("pagehide", onPageHide);
  return () => {
    window.removeEventListener("pagehide", onPageHide);
    void flushPreferences();
    if (account === next) account = null;
  };
}

/** Applies the account's values, except settings changed in this page. */
export function applyAccountPreferences(
  row: Partial<Record<PreferenceKey, unknown>>,
) {
  for (const [key, binding] of bindings) {
    const value = row[key];
    if (value == null || dirty.has(key)) continue;
    const parsed = preferencesPatchSchema.shape[key].safeParse(value);
    if (parsed.success && parsed.data != null) binding.apply(parsed.data);
  }
}

/** This browser's valid stored values, for seeding a new account row. */
export function localPreferences(keys?: Iterable<PreferenceKey>) {
  const patch: Record<string, unknown> = {};
  for (const key of keys ?? bindings.keys()) {
    const value = bindings.get(key)?.readLocal();
    if (
      value !== undefined &&
      preferencesPatchSchema.shape[key].safeParse(value).success
    ) {
      patch[key] = value;
    }
  }
  return patch as PreferencesPatch;
}

/** Saves the settings changed in this page before the account loaded. */
export function saveDirtyPreferences() {
  const patch = localPreferences(dirty);
  if (Object.keys(patch).length > 0) savePreference(patch);
}
