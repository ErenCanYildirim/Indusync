import type React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dienstleister Details | IndustrieConnect",
  description: "Details zu Ihrem ausgewählten Dienstleister auf IndustrieConnect.",
};

export default function DienstleisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 