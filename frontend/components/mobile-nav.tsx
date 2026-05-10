"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link as IntlLink } from "@/navigation";
import { LanguageSwitcher } from "@/components/landing/LanguageSwitcher";

export function MobileNav() {
  const t = useTranslations("Navigation");
  const [isOpen, setIsOpen] = React.useState(false);

  const scrollToSection = (sectionId: string) => {
    setIsOpen(false);
    setTimeout(() => {
      const section = document.getElementById(sectionId);
      if (section) {
        section.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  return (
    <div className="md:hidden">
      <button
        className="p-2 rounded-md hover:bg-muted transition-colors text-foreground"
        onClick={() => setIsOpen(true)}
        aria-label={t("openMenu")}
      >
        <Menu className="h-6 w-6" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-y-0 right-0 z-50 w-[280px] max-w-[80%] bg-card shadow-xl border-l border-border"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              mass: 1,
            }}
          >
            <div className="flex flex-col h-full p-6">
              <div className="flex justify-between items-center mb-8">
                <IntlLink
                  href="/"
                  className="font-semibold text-xl"
                  onClick={() => setIsOpen(false)}
                >
                  <span className="text-foreground font-bold">Indusync</span>
                  <span className="text-primary">.</span>
                </IntlLink>
                <button
                  className="p-1 rounded-full hover:bg-muted transition-colors text-foreground"
                  onClick={() => setIsOpen(false)}
                  aria-label={t("closeMenu")}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex flex-col space-y-6">
                <button
                  onClick={() => scrollToSection("ueber-uns")}
                  className="text-left text-base font-medium text-foreground hover:text-primary transition-colors py-1"
                >
                  {t("about")}
                </button>
                <button
                  onClick={() => scrollToSection("fachbereiche")}
                  className="text-left text-base font-medium text-foreground hover:text-primary transition-colors py-1"
                >
                  {t("specializedAreas")}
                </button>
                <button
                  onClick={() => scrollToSection("referenzen")}
                  className="text-left text-base font-medium text-foreground hover:text-primary transition-colors py-1"
                >
                  {t("references")}
                </button>
                <button
                  onClick={() => scrollToSection("dienstleistung")}
                  className="text-left text-base font-medium text-foreground hover:text-primary transition-colors py-1"
                >
                  {t("services")}
                </button>
              </nav>

              <div className="mt-auto pt-6 space-y-4">
                {/* Language Switcher */}
                <div className="border-t border-border pt-4">
                  <LanguageSwitcher
                    variant="mobile"
                    onLanguageChange={() => setIsOpen(false)}
                  />
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <IntlLink
                    href="/login"
                    className="block w-full"
                    onClick={() => setIsOpen(false)}
                  >
                    <Button
                      variant="outline"
                      className="w-full rounded-md border-border font-medium text-foreground hover:bg-muted"
                    >
                      {t("login")}
                    </Button>
                  </IntlLink>
                  <IntlLink
                    href="/register"
                    className="block w-full"
                    onClick={() => setIsOpen(false)}
                  >
                    <Button className="w-full bg-primary hover:bg-primary/90 rounded-md font-medium text-primary-foreground">
                      {t("register")}
                    </Button>
                  </IntlLink>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
