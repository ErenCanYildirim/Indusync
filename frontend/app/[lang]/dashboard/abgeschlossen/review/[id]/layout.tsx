import type React from "react";
import type { Metadata } from "next";
import { useTranslations } from "next-intl";

export const metadata: Metadata = {
  title: "Unternehmensbewertung | IndustrieConnect",
  description:
    "Bewerten Sie Ihre Zusammenarbeit mit dem Dienstleister auf IndustrieConnect.",
};

export default function ReviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
