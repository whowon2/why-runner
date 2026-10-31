"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import type { UserPreference } from "@/drizzle/schema";
// Binds the editor settings even on pages without an editor, so the
// account's values reach localStorage before one opens.
import "@/hooks/use-editor-settings";
import { getUserPreferences } from "@/lib/actions/preferences/get-preferences";
import { seedUserPreferences } from "@/lib/actions/preferences/update-preferences";
import { authClient } from "@/lib/auth/client";
import { COLOR_MODES, type ColorMode } from "@/lib/preferences";
import {
  applyAccountPreferences,
  bindPreference,
  connectPreferences,
  localPreferences,
  saveDirtyPreferences,
} from "@/lib/preferences-sync";

/**
 * Keeps the signed-in user's settings in their account: applies the stored
 * values once per page load, seeds the row from this browser the first time,
 * and saves later changes. Signed out, settings stay local only.
 */
export function PreferencesSync() {
  const t = useTranslations("Preferences");
  const queryClient = useQueryClient();
  const { setTheme } = useTheme();
  const { data: session } = authClient.useSession();
  const userId = session?.user.id;
  const queryKey = ["preferences", userId];
  const synced = useRef<string | null>(null);

  const { data, isSuccess } = useQuery({
    queryKey,
    queryFn: () => getUserPreferences(),
    enabled: !!userId,
    // Applied once per load; local changes keep the cache current.
    staleTime: Number.POSITIVE_INFINITY,
    refetchOnWindowFocus: false,
  });

  useEffect(
    () =>
      bindPreference("colorMode", {
        readLocal: () => {
          try {
            const mode = localStorage.getItem("theme");
            return COLOR_MODES.find((m) => m === mode) as ColorMode | undefined;
          } catch {
            return undefined;
          }
        },
        apply: setTheme,
      }),
    [setTheme],
  );

  useEffect(() => {
    if (!userId) return;
    return connectPreferences({
      onSaved: (patch) =>
        queryClient.setQueryData<UserPreference | null>(
          ["preferences", userId],
          (old) => (old ? { ...old, ...patch } : old),
        ),
      onError: () => toast.error(t("saveFailed")),
    });
  }, [userId, queryClient, t]);

  useEffect(() => {
    if (!userId || !isSuccess || synced.current === userId) return;
    synced.current = userId;

    if (data) {
      applyAccountPreferences(data);
      saveDirtyPreferences();
      return;
    }
    seedUserPreferences(localPreferences())
      .then((row) => {
        queryClient.setQueryData(["preferences", userId], row);
        // Another device may have created the row first.
        if (row) applyAccountPreferences(row);
        saveDirtyPreferences();
      })
      .catch(() => toast.error(t("saveFailed")));
  }, [userId, isSuccess, data, queryClient, t]);

  return null;
}
