"use client";

import Link from "next/link";
import { ProjectCreationStepper } from "@/components/project-creation-stepper";
import { RouteGuard } from "@/components/auth/RouteGuard";
import {
  LayoutGrid,
  Briefcase,
  Users,
  BarChart3,
  Settings as SettingsIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";

export default function CreateOrderPage() {
  const t = useTranslations("Dashboard.orders");

  return (
    <RouteGuard requiredPermissions={["canCreateOrders"]}>
      <div className="min-h-screen flex flex-col bg-gray-50">
        {/* Custom Header to match the image */}
        <header className="sticky top-0 z-30 w-full border-b bg-white">
          <div className="container mx-auto flex h-16 items-center justify-between">
            <div className="flex items-center">
              <div className="flex items-center">
                <span className="ml-2 text-xl font-semibold text-primary">
                  Indusync
                </span>
              </div>
            </div>
            <nav className="hidden md:flex items-center space-x-2 lg:space-x-4">
              {[
                { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
                {
                  href: "/dashboard/auftraege",
                  label: "Aufträge",
                  icon: Briefcase,
                  active: true,
                },
                { href: "/dienstleister", label: "Dienstleister", icon: Users },
                { href: "/berichte", label: "Berichte", icon: BarChart3 },
                {
                  href: "/einstellungen",
                  label: "Einstellungen",
                  icon: SettingsIcon,
                },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100",
                    item.active
                      ? "text-primary bg-primary/10 hover:bg-primary/20"
                      : "text-gray-600 hover:text-gray-900"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-4 w-4 mr-2",
                      item.active ? "text-primary" : "text-gray-500"
                    )}
                  />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        <main className="flex-1 container py-8 md:py-10">
          <div className="max-w-5xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight mb-1 text-primary">
                {t("pageTitle")}
              </h1>
              <p className="text-gray-600">{t("pageDescription")}</p>
            </div>

            <ProjectCreationStepper currentStep={0} />
          </div>
        </main>
      </div>
    </RouteGuard>
  );
}

// Helper cn function if not already globally available or imported from lib/utils
function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
