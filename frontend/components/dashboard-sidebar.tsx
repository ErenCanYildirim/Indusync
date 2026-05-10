"use client";

import type React from "react";
import { Link, usePathname } from "@/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  X,
  LucideIcon,
  ChevronLeft,
  ChevronRight,
  Menu,
  Globe,
  Check,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/hooks/useAuth";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/navigation";
import { removeLangFromPath } from "@/lib/navigation";
import { locales, type Lang } from "@/i18n";

// Define a simpler NavItem interface
interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon; // Using LucideIcon type directly
}

interface DashboardSidebarProps {
  isOpen: boolean;
  isMobile: boolean;
  onClose: () => void;
  navItems: NavItem[]; // Changed from navGroups
  onToggle?: () => void;
}

// Design tokens (consider moving to Tailwind theme for global reuse)
const SIDEBAR_BG_COLOR = "bg-[#0A2540]"; // Deep navy
const SIDEBAR_TEXT_COLOR = "text-slate-100";
const SIDEBAR_TEXT_MUTED_COLOR = "text-slate-300";
const ACTIVE_ITEM_BG_COLOR = "bg-white/10"; // Subtle glassy background
const HOVER_ITEM_BG_COLOR = "hover:bg-white/5";

// Language configuration with display names and flags
const languageConfig: Record<
  Lang,
  { name: string; nativeName: string; flag: string }
> = {
  de: { name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
  en: { name: "English", nativeName: "English", flag: "🇺🇸" },
};

export function DashboardSidebar({
  isOpen,
  isMobile,
  onClose,
  navItems,
  onToggle,
}: Readonly<DashboardSidebarProps>) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const t = useTranslations("Dashboard.sidebar");
  const locale = useLocale() as Lang;
  const router = useRouter();

  const isActive = (path: string) => {
    const normalized = removeLangFromPath(pathname) || "/";
    return (
      normalized === path ||
      (path !== "/dashboard" && normalized.startsWith(path))
    );
  };

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

    // Extract path without locale prefix to avoid double locale issue
    const pathWithoutLocale = removeLangFromPath(pathname) || "/";

    // Navigate to the new locale
    router.push(pathWithoutLocale, { locale: newLang });
  };

  // Create navigation items for rendering
  const renderNavItem = (item: NavItem) => {
    const active = isActive(item.href);

    // Different rendering based on sidebar state
    if (!isOpen && !isMobile) {
      // Collapsed desktop sidebar - icon with tooltip
      return (
        <TooltipProvider key={item.href} delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href={item.href}
                className={cn(
                  "group relative flex items-center justify-center rounded-md p-2.5 transition-all duration-200",
                  active
                    ? `${ACTIVE_ITEM_BG_COLOR} ring-1 ring-sky-400/30 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)] before:content-[''] before:absolute before:left-0 before:top-1 before:bottom-1 before:w-1.5 before:rounded-r before:bg-gradient-to-b before:from-sky-400 before:to-cyan-300`
                    : `${SIDEBAR_TEXT_COLOR} ${HOVER_ITEM_BG_COLOR} hover:text-white`
                )}
                aria-current={active ? "page" : undefined}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5",
                    active
                      ? "text-white drop-shadow"
                      : SIDEBAR_TEXT_MUTED_COLOR + " group-hover:text-white"
                  )}
                />
                <span className="sr-only">{item.label}</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent
              side="right"
              className="bg-slate-800 text-white border-slate-700"
            >
              {item.label}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    // Full sidebar with text labels
    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200",
          active
            ? `${ACTIVE_ITEM_BG_COLOR} ring-1 ring-sky-400/30 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)] before:content-[''] before:absolute before:left-0 before:top-1 before:bottom-1 before:w-1.5 before:rounded-r before:bg-gradient-to-b before:from-sky-400 before:to-cyan-300`
            : `${SIDEBAR_TEXT_COLOR} ${HOVER_ITEM_BG_COLOR} hover:text-white`
        )}
        onClick={isMobile ? onClose : undefined}
        aria-current={active ? "page" : undefined}
      >
        <item.icon
          className={cn(
            "h-5 w-5",
            active
              ? "text-white drop-shadow"
              : SIDEBAR_TEXT_MUTED_COLOR + " group-hover:text-white"
          )}
        />
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-transparent",
          SIDEBAR_BG_COLOR,
          "shadow-xl transition-all duration-300 ease-in-out",
          isMobile ? "transform-gpu w-64" : isOpen ? "w-64" : "w-16",
          isMobile && !isOpen ? "-translate-x-full" : "translate-x-0",
          isMobile ? "lg:hidden" : "hidden lg:flex"
        )}
      >
        {/* Sidebar Header */}
        <div
          className={cn(
            "flex h-16 items-center border-b border-sky-800",
            isOpen || isMobile ? "justify-between px-6" : "justify-center"
          )}
        >
          {(isOpen || isMobile) && (
            <Link
              href="/dashboard"
              className="flex items-center gap-2"
              onClick={isMobile ? onClose : undefined}
            >
              <span className="text-xl font-bold text-white">Indusync</span>
            </Link>
          )}

          {isMobile ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className={cn(
                "text-slate-300 hover:text-white hover:bg-sky-800",
                SIDEBAR_TEXT_MUTED_COLOR
              )}
            >
              <X className="h-5 w-5" />
              <span className="sr-only">{t("close")}</span>
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className={cn(
                "text-slate-300 hover:text-white hover:bg-sky-800",
                SIDEBAR_TEXT_MUTED_COLOR,
                !isOpen && "w-full h-10 rounded-none"
              )}
              aria-label={isOpen ? t("collapse") : t("expand")}
            >
              {isOpen ? (
                <ChevronLeft className="h-5 w-5" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
            </Button>
          )}
        </div>

        {/* Navigation Links */}
        <ScrollArea className="flex-1 px-2 py-4">
          <nav
            className={cn(
              "space-y-1.5",
              !isOpen && !isMobile && "flex flex-col items-center"
            )}
          >
            {isMobile || isOpen ? (
              // Full sidebar view
              navItems.map((item) => renderNavItem(item))
            ) : (
              // Collapsed sidebar with icons
              <TooltipProvider delayDuration={100}>
                {navItems.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Tooltip key={item.href}>
                      <TooltipTrigger asChild>
                        <Link
                          href={item.href}
                          className={cn(
                            "relative flex items-center justify-center rounded-md p-2.5 my-1 transition-all duration-200 w-10 h-10",
                            active
                              ? `${ACTIVE_ITEM_BG_COLOR} ring-1 ring-sky-400/30 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)] before:content-[''] before:absolute before:left-0 before:top-1 before:bottom-1 before:w-1.5 before:rounded-r before:bg-gradient-to-b before:from-sky-400 before:to-cyan-300`
                              : `${SIDEBAR_TEXT_COLOR} ${HOVER_ITEM_BG_COLOR} hover:text-white`
                          )}
                          aria-current={active ? "page" : undefined}
                        >
                          <item.icon
                            className={cn(
                              "h-5 w-5",
                              active
                                ? "text-white drop-shadow"
                                : SIDEBAR_TEXT_MUTED_COLOR +
                                    " group-hover:text-white"
                            )}
                          />
                          <span className="sr-only">{item.label}</span>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent
                        side="right"
                        className="bg-slate-800 text-white border-slate-700"
                      >
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </TooltipProvider>
            )}
          </nav>
        </ScrollArea>

        {/* Sidebar Footer with Language Switcher */}
        <div
          className={cn(
            "mt-auto border-t border-sky-800 p-2",
            !isOpen && !isMobile ? "flex justify-center" : ""
          )}
        >
          {isMobile || isOpen ? (
            // Full sidebar view - Language dropdown
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 px-3 py-2.5 text-sm font-medium",
                    SIDEBAR_TEXT_COLOR,
                    HOVER_ITEM_BG_COLOR,
                    "hover:text-white"
                  )}
                >
                  <Globe
                    className={cn(
                      "h-5 w-5",
                      SIDEBAR_TEXT_MUTED_COLOR,
                      "group-hover:text-white"
                    )}
                  />
                  <span className="flex items-center gap-2">
                    <span
                      className="text-base"
                      role="img"
                      aria-label={currentLanguage.name}
                    >
                      {currentLanguage.flag}
                    </span>
                    <span>{currentLanguage.nativeName}</span>
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="min-w-[160px] p-1 bg-slate-800 border-slate-700"
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
                        "flex items-center justify-between gap-3 px-3 py-2 cursor-pointer text-white",
                        "focus:bg-sky-700 focus:text-white",
                        isActive &&
                          "bg-sky-700 text-white font-medium cursor-default"
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
                        <div className="flex flex-col items-start">
                          <span className="text-sm font-medium">
                            {config.nativeName}
                          </span>
                          <span className="text-xs text-slate-300">
                            {config.name}
                          </span>
                        </div>
                      </div>
                      {isActive && (
                        <Check
                          className="h-4 w-4 text-white"
                          aria-hidden="true"
                        />
                      )}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            // Collapsed sidebar - Language icon with tooltip
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "rounded-md p-2.5 transition-colors w-10 h-10",
                          SIDEBAR_TEXT_COLOR,
                          HOVER_ITEM_BG_COLOR,
                          "hover:text-white"
                        )}
                      >
                        <Globe
                          className={cn("h-5 w-5", SIDEBAR_TEXT_MUTED_COLOR)}
                        />
                        <span className="sr-only">{t("language")}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      className="min-w-[160px] p-1 bg-slate-800 border-slate-700"
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
                              "flex items-center justify-between gap-3 px-3 py-2 cursor-pointer text-white",
                              "focus:bg-sky-700 focus:text-white",
                              isActive &&
                                "bg-sky-700 text-white font-medium cursor-default"
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
                              <div className="flex flex-col items-start">
                                <span className="text-sm font-medium">
                                  {config.nativeName}
                                </span>
                                <span className="text-xs text-slate-300">
                                  {config.name}
                                </span>
                              </div>
                            </div>
                            {isActive && (
                              <Check
                                className="h-4 w-4 text-white"
                                aria-hidden="true"
                              />
                            )}
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="bg-slate-800 text-white border-slate-700"
                >
                  {t("language")}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
    </>
  );
}
