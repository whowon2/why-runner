import { getTranslations } from "next-intl/server";
import { LegalContent } from "@/components/legal-content";
import { LegalPage } from "@/components/legal-page";

export async function generateMetadata() {
  const t = await getTranslations("Legal.Cookies");
  return { title: t("title") };
}

export default async function CookiesPage() {
  const t = await getTranslations("Legal");

  return (
    <LegalPage title={t("Cookies.title")} updatedAt={t("updatedAt")}>
      <LegalContent intro={t("Cookies.intro")} sections={t.raw("Cookies.sections")} />
    </LegalPage>
  );
}
