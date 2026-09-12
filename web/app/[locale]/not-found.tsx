import { getTranslations } from "next-intl/server";
import { LinkButton } from "@/components/ui/LinkButton";
import { Zone } from "@/components/system/Zone";
import { Shell } from "@/components/system/Shell";

export default async function LocaleNotFound() {
  const t = await getTranslations("common");

  return (
    <Zone tone="light">
      <Shell className="flex min-h-[60vh] flex-col justify-center py-24">
        <span className="t-code text-steel">404</span>
        <h1 className="t-h2 mt-6 max-w-md text-ink">{t("notFoundTitle")}</h1>
        <div className="mt-10">
          <LinkButton href="/" size="lg">
            {t("back")}
          </LinkButton>
        </div>
      </Shell>
    </Zone>
  );
}
