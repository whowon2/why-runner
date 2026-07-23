import { getTranslations } from "next-intl/server";
import { LegalContent } from "@/components/legal-content";
import { LegalPage } from "@/components/legal-page";

export async function generateMetadata() {
  const t = await getTranslations("Legal.Guidelines");
  return { title: t("title") };
}

export default async function CommunityGuidelinesPage() {
  const t = await getTranslations("Legal");

  return (
    <LegalPage title={t("Guidelines.title")} updatedAt={t("updatedAt")}>
      <LegalContent
        intro={t("Guidelines.intro")}
        sections={t.raw("Guidelines.sections")}
      />
    </LegalPage>
  );
}
