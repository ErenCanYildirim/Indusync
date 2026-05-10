"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { DashboardAppBar } from "@/components/dashboard-app-bar";
import {
  LayoutDashboard,
  FileText,
  ClipboardList,
  CheckCircle,
  Building,
  Users,
  Settings,
  Calendar,
  MessageSquare,
  LucideIcon, // Import LucideIcon
} from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { usePermissions } from "@/lib/hooks/usePermissions";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

// Define NavItem type matching the one in DashboardSidebar
interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export function DashboardLayout({ children }: Readonly<DashboardLayoutProps>) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();
  const t = useTranslations("Dashboard.navigation");
  const currentLocale = useLocale();
  const {
    canCreateOrders,
    canUseMatchingPreview,
    isClient,
    isProvider,
    companyRole,
    companyProfile,
    isLoadingCompanyProfile,
  } = usePermissions();

  // Debug logging to help identify the issue
  console.log("DashboardLayout Debug:", {
    canCreateOrders,
    canUseMatchingPreview,
    isClient,
    isProvider,
    companyRole,
    companyProfile: companyProfile
      ? {
          isAuftraggeber: companyProfile.isAuftraggeber,
          isAuftragnehmer: companyProfile.isAuftragnehmer,
        }
      : null,
    isLoadingCompanyProfile,
  });

  // Define navigation groups with translations
  const navGroups = [
    {
      id: "projekte",
      label: t("projects"),
      items: [
        { href: "/dashboard", label: t("dashboard"), icon: LayoutDashboard },
        { href: "/dashboard/auftraege", label: t("orders"), icon: FileText },
        // Only show inquiries for AN-only companies or companies with both roles
        // Hide for AG-only companies (as per requirement 4.1)
        ...(isProvider
          ? [
              {
                href: "/dashboard/anfragen",
                label: t("inquiries"),
                icon: ClipboardList,
              },
            ]
          : []),
        {
          href: "/dashboard/abgeschlossen",
          label: t("completed"),
          icon: CheckCircle,
        },
        { href: "/dashboard/kalender", label: t("calendar"), icon: Calendar },
      ],
    },
    {
      id: "unternehmen",
      label: t("company"),
      items: [
        {
          href: "/dashboard/unternehmensprofil",
          label: t("companyProfile"),
          icon: Building,
        },
        // { href: "/dashboard/mitarbeiter", label: t("employees"), icon: Users },
        // {
        //   href: "/dashboard/schulungen",
        //   label: t("training"),
        //   icon: MessageSquare,
        // },
        // {
        //   href: "/dashboard/rechnungen",
        //   label: t("invoices"),
        //   icon: FileText,
        // },
      ],
    },
    {
      id: "einstellungen",
      label: t("settings"),
      items: [
        {
          href: "/dashboard/kontoeinstellungen",
          label: t("accountSettings"),
          icon: Settings,
        },
      ],
    },
  ];

  // Transform navGroups to the flat navItems array required by DashboardSidebar
  const navItems: NavItem[] = navGroups.reduce((acc: NavItem[], group) => {
    group.items.forEach((item) => {
      acc.push({
        href: item.href,
        label: item.label,
        icon: item.icon,
      });
    });
    return acc;
  }, []);

  // Close mobile sidebar when route changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Store sidebar state in local storage
  useEffect(() => {
    const savedState = localStorage.getItem("sidebarState");
    if (savedState) {
      setIsSidebarOpen(savedState === "open");
    }
  }, []);

  // Update local storage when sidebar state changes
  useEffect(() => {
    localStorage.setItem("sidebarState", isSidebarOpen ? "open" : "closed");
  }, [isSidebarOpen]);

  // Handle screen resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        // On mobile, always close the desktop sidebar
        setIsMobileOpen(false);
      }
    };

    // Set initial state
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => {
    if (window.innerWidth < 1024) {
      setIsMobileOpen(!isMobileOpen);
    } else {
      setIsSidebarOpen(!isSidebarOpen);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar for desktop */}
      <DashboardSidebar
        isOpen={isSidebarOpen}
        isMobile={false}
        onClose={() => setIsSidebarOpen(false)}
        navItems={navItems}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Mobile sidebar */}
      <DashboardSidebar
        isOpen={isMobileOpen}
        isMobile={true}
        onClose={() => setIsMobileOpen(false)}
        navItems={navItems}
      />

      {/* Main content */}
      <div className="flex flex-col flex-1">
        <DashboardAppBar
          onMenuClick={toggleSidebar}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        <main
          className={cn(
            "flex-1 transition-all duration-300 ease-in-out",
            isSidebarOpen ? "lg:ml-64" : "lg:ml-16"
          )}
        >
          <div className="p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
