import React from "react";
import { ColumnDef } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Eye,
  MoreHorizontal,
  Star,
  MapPin,
  ExternalLink,
  Users,
  Building,
} from "lucide-react";
import type { CompanyMatchResponse } from "@/lib/api/types";
import { useTranslations, useLocale } from "next-intl";

export function useOrderMatchesColumns(
  onViewProfile?: (match: CompanyMatchResponse) => void,
  onViewOrder?: (match: CompanyMatchResponse) => void,
  onSelectProvider?: (match: CompanyMatchResponse) => void,
  canSelectProvider?: boolean,
  providerSelected?: boolean
): ColumnDef<CompanyMatchResponse>[] {
  const t = useTranslations("Dashboard.orderMatches");
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

  const formatAddress = (company: CompanyMatchResponse["company"]): string => {
    if (!company) return t("table.noAddress");
    if (company.formattedAddress) {
      return company.formattedAddress;
    }
    const parts = [];
    if (company.street && company.houseNumber) {
      parts.push(`${company.street} ${company.houseNumber}`);
    }
    if (company.postalCode && company.city) {
      parts.push(`${company.postalCode} ${company.city}`);
    }
    return parts.join(", ") || t("table.incompleteAddress");
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return t("table.noActivity");
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(
        currentLocale === "de" ? "de-DE" : "en-US"
      );
    } catch {
      return t("table.invalidDate");
    }
  };

  const formatTime = (dateString?: string): string => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString(
        currentLocale === "de" ? "de-DE" : "en-US",
        { hour: "2-digit", minute: "2-digit" }
      );
    } catch {
      return "";
    }
  };

  return [
    {
      id: "company",
      header: t("table.company"),
      accessorFn: (row) =>
        row.company?.companyName || `Provider ${row.providerId.slice(0, 8)}...`,
      cell: ({ getValue, row }) => (
        <div className="flex items-center gap-2">
          <Building className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <div className="space-y-1">
            <div className="font-medium text-gray-900">
              {getValue() as string}
            </div>
            {row.company?.companyType && (
              <div className="text-xs text-gray-500">
                {row.company.companyType}
              </div>
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
            {row.isHighQuality && (
              <div className="flex items-center gap-1 text-amber-600">
                <Star className="h-3 w-3 fill-current" />
                <span className="text-xs">{t("labels.top")}</span>
              </div>
            )}
          </div>
        );
      },
      sortable: true,
      align: "center",
    },
    {
      id: "address",
      header: t("table.address"),
      accessorFn: (row) => formatAddress(row.company),
      cell: ({ getValue }) => (
        <div className="text-sm">
          <div className="flex items-start gap-1">
            <MapPin className="h-3 w-3 mt-0.5 text-muted-foreground flex-shrink-0" />
            <span className="break-words">{getValue() as string}</span>
          </div>
        </div>
      ),
      searchable: true,
    },
    {
      id: "workRadius",
      header: t("table.workRadius"),
      accessorFn: (row) => row.company?.workRadiusKm,
      cell: ({ getValue }) => {
        const radius = getValue() as number;
        return (
          <div className="text-sm">
            {radius ? (
              <span>{radius} km</span>
            ) : (
              <span className="text-muted-foreground">
                {t("table.notSpecified")}
              </span>
            )}
          </div>
        );
      },
      sortable: true,
      className: "hidden md:table-cell",
    },
    {
      id: "status",
      header: t("table.status"),
      cell: ({ row }) => (
        <div className="space-y-1">
          {row.viewedAt ? (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-green-700">
                {t("status.viewed")}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <span className="text-sm text-muted-foreground">
                {t("status.notViewed")}
              </span>
            </div>
          )}
          {row.interested &&
            canSelectProvider &&
            !providerSelected &&
            !row.accepted && (
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 text-blue-600 fill-current" />
                <span className="text-xs text-blue-700">
                  {t("status.interested")}
                </span>
              </div>
            )}
        </div>
      ),
      className: "hidden lg:table-cell",
    },
    {
      id: "lastActivity",
      header: t("table.lastActivity"),
      accessorKey: "respondedAt",
      cell: ({ getValue }) => {
        const dateString = getValue() as string;
        return (
          <div className="text-sm">
            {dateString ? (
              <div>
                <div className="font-medium">{formatDate(dateString)}</div>
                <div className="text-xs text-muted-foreground">
                  {formatTime(dateString)}
                </div>
              </div>
            ) : (
              <span className="text-muted-foreground">
                {t("table.noActivity")}
              </span>
            )}
          </div>
        );
      },
      sortable: true,
      className: "hidden lg:table-cell",
    },
    {
      id: "activity",
      header: t("table.activity"),
      cell: ({ row }) => (
        <div className="text-center">
          {row.viewed ? (
            <Eye className="inline h-4 w-4 text-green-600" />
          ) : (
            <Eye className="inline h-4 w-4 text-gray-400" />
          )}
        </div>
      ),
      align: "center",
    },
    {
      id: "actions",
      header: t("table.actions"),
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">{t("actions.actions")}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onViewProfile?.(row)}>
              <ExternalLink className="h-4 w-4 mr-2" />
              {t("actions.profile")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onViewOrder?.(row)}>
              <Eye className="h-4 w-4 mr-2" />
              {t("actions.view")}
            </DropdownMenuItem>
            {row.interested &&
              canSelectProvider &&
              !providerSelected &&
              !row.accepted && (
                <DropdownMenuItem onClick={() => onSelectProvider?.(row)}>
                  <Users className="h-4 w-4 mr-2" />
                  {t("actions.select")}
                </DropdownMenuItem>
              )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      align: "center",
      sortable: false,
      filterable: false,
      searchable: false,
    },
  ];
}
