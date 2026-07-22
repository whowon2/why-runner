import { ArrowLeft, TerminalSquare } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";

export default async function NotFound() {
  const t = await getTranslations("NotFound");

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-8">
      <Card className="border-dashed border-2 bg-muted/20 max-w-lg w-full">
        <CardContent className="flex flex-col items-center p-10 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-red-500/10 mb-6">
            <TerminalSquare className="h-10 w-10 text-red-500" />
          </div>

          <CardTitle className="mb-2 text-2xl font-semibold">
            {t("title")}
          </CardTitle>
          <CardDescription className="max-w-md mb-6 text-base">
            {t("description")}
          </CardDescription>

          <div className="w-full rounded-lg bg-muted/40 border border-border p-4 text-left font-mono text-sm space-y-1.5 mb-8">
            <p className="text-muted-foreground">{t("promptLine")}</p>
            <p>
              <span className="inline-block px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 font-semibold mr-2">
                {t("verdict")}
              </span>
              <span className="text-muted-foreground">{t("statusLine")}</span>
            </p>
            <p className="text-red-500">{t("errorLine")}</p>
          </div>

          <div className="relative group">
            <div className="absolute -inset-1 blur-lg bg-linear-to-r from-indigo-500 to-cyan-500 opacity-20 group-hover:opacity-40 transition duration-500 rounded-lg" />
            <div className="relative">
              <Link href="/">
                <Button>
                  <ArrowLeft />
                  {t("goHome")}
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
