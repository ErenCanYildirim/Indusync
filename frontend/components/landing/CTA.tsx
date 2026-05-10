"use client";

import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

export function CTA() {
  const t = useTranslations("CTA");
  return (
    <section className="py-20 bg-gradient-to-r from-primary to-primary/80 text-white">
      <div className="container">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">{t("title")}</h2>
          <p className="text-xl opacity-90 mb-10 max-w-2xl mx-auto">
            {t("description")}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
              size="lg"
              className="w-full sm:w-auto font-medium bg-white text-primary hover:bg-zinc-100 px-8 py-6 rounded-md"
            >
              {t("createOrderButton")}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto font-medium bg-transparent hover:bg-white/10 text-white border-white px-8 py-6 rounded-md"
            >
              {t("becomeProviderButton")}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}