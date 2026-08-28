"use client";

import { useTranslations } from "next-intl";
import type { NotificationType } from "@/drizzle/schema";
import { Switch } from "@/components/ui/switch";
import {
  useNotificationPreferences,
  useUpdateNotificationPreference,
} from "@/hooks/use-notification-preferences";

const GROUPS = [
  {
    id: "contests",
    types: [
      "CONTEST_JOIN_REQUEST",
      "CONTEST_JOIN_APPROVED",
      "CONTEST_JOIN_REJECTED",
    ],
  },
  { id: "submissions", types: ["SUBMISSION_GRADED"] },
  { id: "lessons", types: ["LESSON_UNLOCKED"] },
] as const satisfies { id: string; types: NotificationType[] }[];

export function NotificationsSection() {
  const t = useTranslations("SettingsPage.notifications");
  const { data: preferences } = useNotificationPreferences();
  const updatePreference = useUpdateNotificationPreference();

  const enabledByType = new Map(
    (preferences ?? []).map((p) => [p.type, p.enabled]),
  );

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">{t("title")}</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          {t("description")}
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {GROUPS.map((group) => (
          <div key={group.id} className="flex flex-col gap-1 border">
            <h3 className="text-sm font-medium px-4 py-2 border-b bg-secondary/50">
              {t(`groups.${group.id}`)}
            </h3>
            {group.types.map((type) => (
              <div
                key={type}
                className="flex items-center justify-between gap-4 px-4 py-3 border-b last:border-b-0"
              >
                <span className="text-sm">{t(`types.${type}`)}</span>
                <Switch
                  checked={enabledByType.get(type) ?? true}
                  disabled={!preferences}
                  onCheckedChange={(checked) =>
                    updatePreference.mutate({ type, enabled: checked })
                  }
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
