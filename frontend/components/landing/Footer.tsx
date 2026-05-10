"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("Footer");
  return (
    <footer className="bg-zinc-900 text-white py-16">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div>
            <h3 className="font-bold text-xl mb-4">
              Indusync<span className="text-primary">.</span>
            </h3>
            <p className="text-zinc-400 mb-6">{t("tagline")}</p>
            <div className="flex space-x-4">
              <a
                href="https://www.linkedin.com/company/indusync-ug"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-zinc-800 rounded-full hover:bg-primary transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                  <rect x="2" y="9" width="4" height="12"></rect>
                  <circle cx="4" cy="4" r="2"></circle>
                </svg>
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-bold mb-4">{t("aboutIndusyncTitle")}</h4>
            <ul className="space-y-3 text-zinc-400">
              <li>
                <Link
                  href="#ueber-uns"
                  className="hover:text-primary/80 transition-colors"
                >
                  {t("companyHistory")}
                </Link>
              </li>
              <li>
                <Link
                  href="/impressum"
                  className="hover:text-primary/80 transition-colors"
                >
                  {t("ourGoal")}
                </Link>
              </li>
              <li>
                <Link
                  href="/karriere"
                  className="hover:text-primary/80 transition-colors"
                >
                  {t("career")}
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="hover:text-primary/80 transition-colors"
                >
                  {t("newsletter")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">{t("customerSupportTitle")}</h4>
            <ul className="space-y-3 text-zinc-400">
              <li>
                <Link
                  href="#kontakt"
                  className="hover:text-primary/80 transition-colors"
                >
                  {t("contact")}
                </Link>
              </li>
              <li>
                <Link
                  href="#kontakt"
                  className="hover:text-primary/80 transition-colors"
                >
                  {t("corporateTraining")}
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="hover:text-primary/80 transition-colors"
                >
                  {t("faq")}
                </Link>
              </li>
              <li>
                <Link
                  href="#kontakt"
                  className="hover:text-primary/80 transition-colors"
                >
                  {t("support")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">{t("legalTitle")}</h4>
            <ul className="space-y-3 text-zinc-400">
              <li>
                <Link
                  href="/datenschutz"
                  className="hover:text-primary/80 transition-colors"
                >
                  {t("privacy")}
                </Link>
              </li>
              <li>
                <Link
                  href="/agb"
                  className="hover:text-primary/80 transition-colors"
                >
                  {t("agb")}
                </Link>
              </li>
              <li>
                <Link
                  href="/impressum"
                  className="hover:text-primary/80 transition-colors"
                >
                  {t("imprint")}
                </Link>
              </li>
              <li>
                <Link
                  href="/cookies"
                  className="hover:text-primary/80 transition-colors"
                >
                  {t("cookiePolicy")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/*Add this back later if desired*/}
        {/*
        <div className="border-t border-zinc-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-zinc-500 text-sm mb-4 md:mb-0">
           {translations.copyright}
          </p>
          <div className="flex space-x-6">
            <Link
              href="/datenschutz"
              className="text-zinc-500 text-sm hover:text-primary/80 transition-colors"
            >
              {translations.privacy}
            </Link>
            <Link
              href="/agb"
              className="text-zinc-500 text-sm hover:text-primary/80 transition-colors"
            >
              {translations.agb}
            </Link>
            <Link
              href="/impressum"
              className="text-zinc-500 text-sm hover:text-primary/80 transition-colors"
            >
              {translations.imprint}
            </Link>
          </div>
        </div>
        */}
      </div>
    </footer>
  );
}