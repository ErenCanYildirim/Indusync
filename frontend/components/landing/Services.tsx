"use client";

import { Users, Globe, BarChart, Shield } from "lucide-react";
import { useTranslations } from "next-intl";

export function Services() {
  const t = useTranslations("Services");
  return (
    <section id="dienstleistung" className="py-20 bg-zinc-50 scroll-mt-20">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("title")}</h2>
          <div className="w-20 h-1 bg-primary mx-auto"></div>
          <p className="mt-6 text-zinc-600 max-w-2xl mx-auto">
            {t("description")}
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
          <div className="flex gap-6">
            <div className="flex-shrink-0">
              <div className="p-4 rounded-full bg-primary/10 text-primary h-fit">
                <Users className="h-8 w-8" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-3 text-zinc-900">
                {t("service1Title")}
              </h3>
              <p className="text-zinc-600">{t("service1Description")}</p>
            </div>
          </div>

          <div className="flex gap-6">
            <div className="flex-shrink-0">
              <div className="p-4 rounded-full bg-primary/10 text-primary h-fit">
                <Globe className="h-8 w-8" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-3 text-zinc-900">
                {t("service2Title")}
              </h3>
              <p className="text-zinc-600">{t("service2Description")}</p>
            </div>
          </div>

          <div className="flex gap-6">
            <div className="flex-shrink-0">
              <div className="p-4 rounded-full bg-primary/10 text-primary h-fit">
                <BarChart className="h-8 w-8" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-3 text-zinc-900">
                {t("service3Title")}
              </h3>
              <p className="text-zinc-600">{t("service3Description")}</p>
            </div>
          </div>

          <div className="flex gap-6">
            <div className="flex-shrink-0">
              <div className="p-4 rounded-full bg-primary/10 text-primary h-fit">
                <Shield className="h-8 w-8" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-3 text-zinc-900">
                {t("service4Title")}
              </h3>
              <p className="text-zinc-600">{t("service4Description")}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}