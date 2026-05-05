import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default async function NotFound() {
  const t = await getTranslations("NotFound");

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center p-8">
      <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
      <h2 className="text-2xl font-semibold">{t("title")}</h2>
      <p className="text-muted-foreground max-w-md">{t("description")}</p>
      <Link href="/">
        <Button>
          <ArrowLeft />
          {t("goHome")}
        </Button>
      </Link>
    </div>
  );
}
