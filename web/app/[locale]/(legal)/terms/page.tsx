import { getTranslations } from "next-intl/server";
import { LegalContent } from "@/components/legal-content";
import { LegalPage } from "@/components/legal-page";

export async function generateMetadata() {
  const t = await getTranslations("Legal.Terms");
  return { title: t("title") };
}

export default async function TermsPage() {
  const t = await getTranslations("Legal");

  return (
    <LegalPage title={t("Terms.title")} updatedAt={t("updatedAt")}>
      <LegalContent
        intro={t("Terms.intro")}
        sections={t.raw("Terms.sections")}
      />
    </LegalPage>
  );
}
