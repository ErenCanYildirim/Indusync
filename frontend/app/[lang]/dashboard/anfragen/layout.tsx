import type React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kundenanfragen | IndustrieConnect",
  description:
    "Verwalten Sie Ihre eingehenden Kundenanfragen auf IndustrieConnect.",
};

export default function AnfragenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
