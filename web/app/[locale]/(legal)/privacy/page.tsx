import { getTranslations } from "next-intl/server";
import { LegalContent } from "@/components/legal-content";
import { LegalPage } from "@/components/legal-page";

export async function generateMetadata() {
  const t = await getTranslations("Legal.Privacy");
  return { title: t("title") };
}

export default async function PrivacyPage() {
  const t = await getTranslations("Legal");

  return (
    <LegalPage title={t("Privacy.title")} updatedAt={t("updatedAt")}>
      <LegalContent intro={t("Privacy.intro")} sections={t.raw("Privacy.sections")} />
    </LegalPage>
  );
}
