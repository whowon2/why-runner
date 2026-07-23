import { getTranslations } from "next-intl/server";
import { LegalContent } from "@/components/legal-content";
import { LegalPage } from "@/components/legal-page";

export async function generateMetadata() {
  const t = await getTranslations("Legal.Copyright");
  return { title: t("title") };
}

export default async function CopyrightPage() {
  const t = await getTranslations("Legal");

  return (
    <LegalPage title={t("Copyright.title")} updatedAt={t("updatedAt")}>
      <LegalContent intro={t("Copyright.intro")} sections={t.raw("Copyright.sections")} />
    </LegalPage>
  );
}
