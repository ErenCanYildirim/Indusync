import type React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Projektdetails | IndustrieConnect",
  description: "Detaillierte Informationen zum ausgewählten Projekt auf IndustrieConnect.",
};

export default function ProjectDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 