import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslations, useLocale } from "next-intl";
import type { CompanyProfile } from "@/lib/api/types";

type Props = {
  company?: CompanyProfile | null;
};

// Mapping utility for backend German values to frontend translations
const mapBackendToFrontend = (
  backendValue: string | undefined,
  locale: string
) => {
  if (!backendValue) return backendValue;

  const mappings: Record<string, Record<string, string>> = {
    de: {
      Auftraggeber: "Auftraggeber",
      Auftragnehmer: "Auftragnehmer",
      GmbH: "GmbH",
      AG: "AG",
      Einzelunternehmen: "Einzelunternehmen",
      GbR: "GbR",
      UG: "UG",
      OHG: "OHG",
      KG: "KG",
      "GmbH & Co. KG": "GmbH & Co. KG",
      Aktiv: "Aktiv",
      Inaktiv: "Inaktiv",
      Verifiziert: "Verifiziert",
      "Nicht verifiziert": "Nicht verifiziert",
    },
    en: {
      Auftraggeber: "Client",
      Auftragnehmer: "Service Provider",
      GmbH: "GmbH",
      AG: "AG",
      Einzelunternehmen: "Sole Proprietorship",
      GbR: "GbR",
      UG: "UG",
      OHG: "OHG",
      KG: "KG",
      "GmbH & Co. KG": "GmbH & Co. KG",
      Aktiv: "Active",
      Inaktiv: "Inactive",
      Verifiziert: "Verified",
      "Nicht verifiziert": "Not verified",
    },
  };

  return mappings[locale]?.[backendValue] || backendValue;
};

export const MetaCard: React.FC<Props> = ({ company }) => {
  const t = useTranslations("Dashboard.companyProfile.meta");
  const currentLocale = useLocale();

  if (!company) return null;

  const rows: { label: string; value?: React.ReactNode }[] = [
    {
      label: t("companyType"),
      value: mapBackendToFrontend(company.companyType, currentLocale),
    },
    {
      label: t("status"),
      value: mapBackendToFrontend(company.status, currentLocale),
    },
    {
      label: t("verified"),
      value: company.verified ? t("yes") : t("no"),
    },
  ];

  // Filter out undefined/null/empty-string (but keep boolean false case handled above)
  const visibleRows = rows.filter(
    (r) => r.value !== undefined && r.value !== null && r.value !== ""
  );
  if (visibleRows.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {visibleRows.map((r) => (
          <div key={r.label} className="flex justify-between">
            <span className="text-gray-500">{r.label}</span>
            <span className="font-medium">{r.value}</span>
          </div>
        ))}
        {/* Auftraggeber / Auftragnehmer badges */}
        {(company.isAuftraggeber || company.isAuftragnehmer) && (
          <div className="flex gap-2 pt-2">
            {company.isAuftraggeber && (
              <Badge variant="secondary">
                {mapBackendToFrontend("Auftraggeber", currentLocale)}
              </Badge>
            )}
            {company.isAuftragnehmer && (
              <Badge variant="secondary">
                {mapBackendToFrontend("Auftragnehmer", currentLocale)}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
export default MetaCard;
