import type React from "react";
import type { Metadata } from "next";
import { DashboardLayout } from "@/components/dashboard-layout";
import { RouteProtection } from "@/components/RouteProtection";

export const metadata: Metadata = {
  title: "Dashboard | Indusync",
  description:
    "Verwalten Sie Ihre Projekte und Unternehmensprofile auf Indusync.",
};

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RouteProtection requireAuth={true} requireEmailVerified={true}>
      <DashboardLayout>{children}</DashboardLayout>
    </RouteProtection>
  );
}
