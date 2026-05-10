"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/mobile-nav";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useTranslations } from "next-intl";
import { Link as IntlLink } from "@/navigation";

export function Header() {
  const t = useTranslations("Navigation");
  return (
    <header className="fixed top-0 z-50 w-full border-b bg-white">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center">
          <IntlLink href="/" className="font-semibold text-xl tracking-tight">
            <span className="text-zinc-900 font-bold">Indusync</span>
            <span className="text-primary"></span>
          </IntlLink>
          <nav className="hidden md:flex ml-10 gap-8">
            <Link
              href="#ueber-uns"
              className="text-sm font-medium text-zinc-700 hover:text-primary transition-colors"
            >
              {t("about")}
            </Link>
            <Link
              href="#fachbereiche"
              className="text-sm font-medium text-zinc-700 hover:text-primary transition-colors"
            >
              {t("specializedAreas")}
            </Link>
            <Link
              href="#referenzen"
              className="text-sm font-medium text-zinc-700 hover:text-primary transition-colors"
            >
              {t("references")}
            </Link>
            <Link
              href="#dienstleistung"
              className="text-sm font-medium text-zinc-700 hover:text-primary transition-colors"
            >
              {t("services")}
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <IntlLink href="/login" className="hidden md:inline-flex">
            <Button variant="outline" className="mr-2 font-medium">
              {t("login")}
            </Button>
          </IntlLink>
          <IntlLink href="/registrieren" className="hidden md:inline-flex">
            <Button className="font-medium bg-primary hover:bg-primary/90 text-primary-foreground">
              {t("register")}
            </Button>
          </IntlLink>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}