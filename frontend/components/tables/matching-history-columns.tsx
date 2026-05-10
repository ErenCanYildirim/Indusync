import React from "react";
import { ColumnDef } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Shield, ExternalLink, Building } from "lucide-react";
import type { MatchingCompanyResponse } from "@/lib/types/matching";
import { useTranslations, useLocale } from "next-intl";

export function useMatchingHistoryColumns(
  onViewProfile?: (match: MatchingCompanyResponse) => void
): ColumnDef<MatchingCompanyResponse>[] {
  const t = useTranslations("Dashboard.matchingHistory");
  const currentLocale = useLocale();

  // Helper functions
  const getMatchQuality = (
    score: number
  ): {
    label: string;
    variant: "default" | "outline";
    className?: string;
  } => {
    if (score >= 0.9)
      return {
        label: t("quality.excellent"),
        variant: "default",
        className: "bg-green-100 text-green-700",
      };
    if (score >= 0.8)
      return {
        label: t("quality.veryGood"),
        variant: "default",
        className: "bg-blue-100 text-blue-700",
      };
    if (score >= 0.7)
      return {
        label: t("quality.good"),
        variant: "outline",
        className: "bg-yellow-100 text-yellow-700",
      };
    if (score >= 0.6)
      return {
        label: t("quality.satisfactory"),
        variant: "outline",
        className: "bg-orange-100 text-orange-700",
      };
    return {
      label: t("quality.low"),
      variant: "outline",
      className: "bg-gray-100 text-gray-700",
    };
  };

  const formatScoreDetails = (match: MatchingCompanyResponse): string => {
    const details = [];
    if (match.industryScore !== undefined)
      details.push(
        `${t("scoreDetails.industry")}: ${Math.round(
          match.industryScore * 100
        )}%`
      );
    if (match.skillsScore !== undefined)
      details.push(
        `${t("scoreDetails.skills")}: ${Math.round(match.skillsScore * 100)}%`
      );
    if (match.certificatesScore !== undefined)
      details.push(
        `${t("scoreDetails.certificates")}: ${Math.round(
          match.certificatesScore * 100
        )}%`
      );
    if (match.radiusScore !== undefined)
      details.push(
        `${t("scoreDetails.distance")}: ${Math.round(match.radiusScore * 100)}%`
      );
    return details.join(", ");
  };

  return [
    {
      id: "company",
      header: t("table.company"),
      accessorFn: (row) =>
        row.companyName || `Company ${row.companyId.slice(0, 8)}...`,
      cell: ({ getValue, row }) => (
        <div className="flex items-center gap-2">
          <Building className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <div className="space-y-1">
            <div className="font-medium text-gray-900">
              {getValue() as string}
            </div>
            {row.description && (
              <div className="text-xs text-gray-500">{row.description}</div>
            )}
          </div>
        </div>
      ),
      sortable: true,
      searchable: true,
    },
    {
      id: "matchScore",
      header: t("table.score"),
      accessorKey: "matchScore",
      cell: ({ getValue, row }) => {
        const score = getValue() as number;
        const quality = getMatchQuality(score);
        return (
          <div className="space-y-1">
            <Badge variant={quality.variant} className={quality.className}>
              {Math.round(score * 100)}%
            </Badge>
            <div className="text-xs text-gray-500">{quality.label}</div>
          </div>
        );
      },
      sortable: true,
      align: "center",
    },
    {
      id: "address",
      header: t("table.address"),
      accessorKey: "city",
      cell: ({ getValue }) => (
        <div className="text-sm">
          <div className="flex items-start gap-1">
            <MapPin className="h-3 w-3 mt-0.5 text-muted-foreground flex-shrink-0" />
            <span className="break-words">
              {(getValue() as string) || t("table.noAddress")}
            </span>
          </div>
        </div>
      ),
      searchable: true,
    },
    {
      id: "distance",
      header: t("table.distance"),
      accessorKey: "distanceKm",
      cell: ({ getValue }) => {
        const distance = getValue() as number;
        return (
          <div className="text-sm">
            {distance !== undefined ? (
              <span>{distance.toFixed(1)} km</span>
            ) : (
              <span className="text-muted-foreground">
                {t("table.notAvailable")}
              </span>
            )}
          </div>
        );
      },
      sortable: true,
      className: "hidden md:table-cell",
    },
    {
      id: "verified",
      header: t("table.verified"),
      accessorKey: "verified",
      cell: ({ getValue }) => {
        const verified = getValue() as boolean;
        return (
          <div className="flex items-center gap-2">
            {verified ? (
              <div className="flex items-center gap-1">
                <Shield className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-700">
                  {t("status.verified")}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <Shield className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-muted-foreground">
                  {t("status.notVerified")}
                </span>
              </div>
            )}
          </div>
        );
      },
      className: "hidden lg:table-cell",
    },
    {
      id: "scoreDetails",
      header: t("table.scoreDetails"),
      cell: ({ row }) => (
        <div className="text-xs text-muted-foreground max-w-xs">
          {formatScoreDetails(row)}
        </div>
      ),
      className: "hidden lg:table-cell",
    },
    {
      id: "actions",
      header: t("table.actions"),
      cell: ({ row }) => (
        <Button variant="ghost" size="sm" onClick={() => onViewProfile?.(row)}>
          <ExternalLink className="h-4 w-4 mr-1" />
          {t("actions.profile")}
        </Button>
      ),
      align: "center",
      sortable: false,
      filterable: false,
      searchable: false,
    },
  ];
}
