"use client";
import { useTranslations } from "next-intl";

export function AboutUs() {
  const t = useTranslations("AboutUs");
  return (
    <section id="ueber-uns" className="py-20 bg-white scroll-mt-20">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("title")}</h2>
          <div className="w-20 h-1 bg-primary mx-auto"></div>
          <p className="mt-6 text-zinc-600 max-w-2xl mx-auto">
            {t("description")}
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-12">
          <div className="flex flex-col">
            <h3 className="text-2xl font-bold mb-4 text-center md:text-left">
              {t("historyTitle")}
            </h3>
            <p className="text-zinc-600 mb-6 text-justify">{t("historyP1")}</p>
            <p className="text-zinc-600 text-justify">{t("historyP2")}</p>
          </div>
          <div className="flex flex-col">
            <h3 className="text-2xl font-bold mb-4 text-center md:text-left">
              {t("missionTitle")}
            </h3>
            <p className="text-zinc-600 mb-6 text-justify">{t("missionP1")}</p>
            <p className="text-zinc-600 text-justify">{t("missionP2")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}