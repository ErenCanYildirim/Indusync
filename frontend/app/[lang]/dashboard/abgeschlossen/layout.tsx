import type React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Abgeschlossene Aufträge | IndustrieConnect",
  description: "Verwalten Sie Ihre abgeschlossenen Aufträge und Projekte auf IndustrieConnect.",
};

export default function CompletedOrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 