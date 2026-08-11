import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";

export default async function RoadmapPage() {
  const locale = await getLocale();
  redirect({ href: "/classes", locale });
}
