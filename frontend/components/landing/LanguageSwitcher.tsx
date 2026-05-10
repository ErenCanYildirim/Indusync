"use client";

import { Button } from "@/components/ui/button";
import { Globe, Check, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/navigation";
import { locales, type Lang } from "@/i18n";
import { cn } from "@/lib/utils";

// Language configuration with display names and flags
const languageConfig: Record<
  Lang,
  { name: string; nativeName: string; flag: string }
> = {
  de: { name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
  en: { name: "English", nativeName: "English", flag: "🇺🇸" },
};

interface LanguageSwitcherProps {
  variant?: "default" | "mobile";
  className?: string;
  onLanguageChange?: () => void;
}

export function LanguageSwitcher({
  variant = "default",
  className,
  onLanguageChange,
}: LanguageSwitcherProps) {
  const locale = useLocale() as Lang;
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("Navigation");

  // Validate locale and provide fallback
  const validLocale = locales.includes(locale as Lang)
    ? (locale as Lang)
    : "de";
  const currentLanguage = languageConfig[validLocale];

  const handleLanguageChange = (newLang: Lang) => {
    // Store language preference in localStorage for persistence
    try {
      localStorage.setItem("preferred-language", newLang);
    } catch (error) {
      console.warn("Failed to save language preference:", error);
    }

    // Call the callback if provided (e.g., to close mobile menu)
    onLanguageChange?.();

    // Navigate to the new locale
    router.push(pathname, { locale: newLang });
  };

  if (variant === "mobile") {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="text-sm font-medium text-muted-foreground px-2 py-1">
          {t("language") || "Language"}
        </div>
        <div className="space-y-1">
          {locales.map((lang) => {
            const config = languageConfig[lang];
            const isActive = validLocale === lang;

            return (
              <button
                key={lang}
                onClick={() => handleLanguageChange(lang)}
                disabled={isActive}
                className={cn(
                  "flex items-center justify-between w-full px-3 py-2 text-sm rounded-md transition-colors",
                  "hover:bg-muted focus:bg-muted focus:outline-none",
                  isActive &&
                    "bg-primary/10 text-primary font-medium cursor-default",
                  !isActive && "text-foreground hover:text-primary"
                )}
                aria-label={`Switch to ${config.name}`}
                aria-current={isActive ? "true" : "false"}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="text-base"
                    role="img"
                    aria-label={config.name}
                  >
                    {config.flag}
                  </span>
                  <span>{config.nativeName}</span>
                </div>
                {isActive && (
                  <Check className="h-4 w-4 text-primary" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-9 px-3 gap-2 font-medium transition-all duration-200",
            "hover:bg-muted hover:border-primary/20",
            "focus:ring-2 focus:ring-primary/20 focus:ring-offset-2",
            className
          )}
          aria-label={`Current language: ${currentLanguage.name}. Click to change language`}
        >
          <span
            className="text-base"
            role="img"
            aria-label={currentLanguage.name}
          >
            {currentLanguage.flag}
          </span>
          <span className="hidden sm:inline-block text-sm">
            {currentLanguage.nativeName}
          </span>
          <ChevronDown className="h-3 w-3 opacity-50" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-[160px] p-1"
        sideOffset={8}
      >
        {locales.map((lang) => {
          const config = languageConfig[lang];
          const isActive = validLocale === lang;

          return (
            <DropdownMenuItem
              key={lang}
              onClick={() => handleLanguageChange(lang)}
              disabled={isActive}
              className={cn(
                "flex items-center justify-between gap-3 px-3 py-2 cursor-pointer",
                "focus:bg-muted focus:text-foreground",
                isActive &&
                  "bg-primary/10 text-primary font-medium cursor-default"
              )}
              aria-label={`Switch to ${config.name}`}
              aria-current={isActive ? "true" : "false"}
            >
              <div className="flex items-center gap-3">
                <span className="text-base" role="img" aria-label={config.name}>
                  {config.flag}
                </span>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">
                    {config.nativeName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {config.name}
                  </span>
                </div>
              </div>
              {isActive && (
                <Check className="h-4 w-4 text-primary" aria-hidden="true" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}