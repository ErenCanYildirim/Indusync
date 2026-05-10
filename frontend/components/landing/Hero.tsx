"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

export function Hero() {
  const t = useTranslations("Hero");
  return (
    <section className="relative bg-gradient-to-r from-zinc-900 to-zinc-800 overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-40">
        <Image
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-W9x0sCChPcZT8d608hlJPVF4twhhaL.png"
          alt="Industrielle Ausrüstung"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-transparent"></div>
      </div>
      <div className="container relative z-10 py-20 md:py-28 lg:py-36">
        <div className="max-w-2xl">
          <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 md:mb-6 text-white leading-tight">
            {t("title")}{" "}
            <span className="text-primary">{t("highlightedTitle")}</span>
          </h1>
          <p className="text-lg md:text-xl opacity-90 mb-8 md:mb-10 text-zinc-100 leading-relaxed">
            {t("subtitle")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              size="lg"
              className="w-full sm:w-auto font-medium bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 rounded-md"
            >
              {t("contactButton")}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto font-medium bg-white/10 hover:bg-white/20 text-white border-white/20 px-8 py-6 rounded-md"
            >
              {t("becomeProviderButton")}
            </Button>
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent"></div>
    </section>
  );
}