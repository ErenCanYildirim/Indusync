"use client";

import Link from "next/link";
import {
  Users,
  Globe,
  CheckCircle,
  Settings,
  ChevronRight,
} from "lucide-react";
import { useTranslations } from "next-intl";

export function SpecializedAreas() {
  const t = useTranslations("SpecializedAreas");
  return (
    <section id="fachbereiche" className="py-20 bg-zinc-50 scroll-mt-20">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("title")}</h2>
          <div className="w-20 h-1 bg-primary mx-auto"></div>
          <p className="mt-6 text-zinc-600 max-w-2xl mx-auto">
            {t("description")}
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Service Card 1 - Refined */}
          <div className="bg-white p-8 rounded-xl shadow-lg border border-zinc-100 hover:shadow-xl transition-all duration-300 flex flex-col items-start h-full transform hover:-translate-y-1 group">
            <div className="p-4 rounded-full bg-primary/10 text-primary mb-6 group-hover:bg-primary/20 transition-colors">
              <Users className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-zinc-900 group-hover:text-primary transition-colors">
              {t("card1Title")}
            </h3>
            <p className="text-zinc-600 mb-4 leading-relaxed">
              {t("card1Description")}
            </p>
            <div className="mt-auto pt-4">
              <Link
                href="#"
                className="text-primary font-medium flex items-center hover:text-primary/90 group-hover:translate-x-1 transition-transform"
              >
                {t("learnMore")} <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </div>

          {/* Service Card 2 - Refined */}
          <div className="bg-white p-8 rounded-xl shadow-lg border border-zinc-100 hover:shadow-xl transition-all duration-300 flex flex-col items-start h-full transform hover:-translate-y-1 group">
            <div className="p-4 rounded-full bg-primary/10 text-primary mb-6 group-hover:bg-primary/20 transition-colors">
              <Globe className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-zinc-900 group-hover:text-primary transition-colors">
              {t("card2Title")}
            </h3>
            <p className="text-zinc-600 mb-4 leading-relaxed">
              {t("card2Description")}
            </p>
            <div className="mt-auto pt-4">
              <Link
                href="#"
                className="text-primary font-medium flex items-center hover:text-primary/90 group-hover:translate-x-1 transition-transform"
              >
                {t("learnMore")} <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </div>

          {/* Service Card 3 - Refined */}
          <div className="bg-white p-8 rounded-xl shadow-lg border border-zinc-100 hover:shadow-xl transition-all duration-300 flex flex-col items-start h-full transform hover:-translate-y-1 group">
            <div className="p-4 rounded-full bg-primary/10 text-primary mb-6 group-hover:bg-primary/20 transition-colors">
              <CheckCircle className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-zinc-900 group-hover:text-primary transition-colors">
              {t("card3Title")}
            </h3>
            <p className="text-zinc-600 mb-4 leading-relaxed">
              {t("card3Description")}
            </p>
            <div className="mt-auto pt-4">
              <Link
                href="#"
                className="text-primary font-medium flex items-center hover:text-primary/90 group-hover:translate-x-1 transition-transform"
              >
                {t("learnMore")} <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </div>

          {/* Service Card 4 - Refined */}
          <div className="bg-white p-8 rounded-xl shadow-lg border border-zinc-100 hover:shadow-xl transition-all duration-300 flex flex-col items-start h-full transform hover:-translate-y-1 group">
            <div className="p-4 rounded-full bg-primary/10 text-primary mb-6 group-hover:bg-primary/20 transition-colors">
              <Settings className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-zinc-900 group-hover:text-primary transition-colors">
              {t("card4Title")}
            </h3>
            <p className="text-zinc-600 mb-4 leading-relaxed">
              {t("card4Description")}
            </p>
            <div className="mt-auto pt-4">
              <Link
                href="#"
                className="text-primary font-medium flex items-center hover:text-primary/90 group-hover:translate-x-1 transition-transform"
              >
                {t("learnMore")} <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}