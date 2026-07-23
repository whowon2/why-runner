import { getTranslations } from "next-intl/server";
import { LegalContent } from "@/components/legal-content";
import { LegalPage } from "@/components/legal-page";

export async function generateMetadata() {
  const t = await getTranslations("Legal.Moderation");
  return { title: t("title") };
}

export default async function ModerationPage() {
  const t = await getTranslations("Legal");

  return (
    <LegalPage title={t("Moderation.title")} updatedAt={t("updatedAt")}>
      <LegalContent intro={t("Moderation.intro")} sections={t.raw("Moderation.sections")} />
    </LegalPage>
  );
}
