import React from "react";
import { ColumnDef } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Eye, Send, MoreHorizontal } from "lucide-react";
import type { OrderMatchResponse } from "@/lib/api/types";
import { useTranslations, useLocale } from "next-intl";

// Define the data type for requests/inquiries
export interface AnfragenData extends OrderMatchResponse {
  // Additional properties if needed
}

export function useAnfragenColumns(
  onView?: (inquiry: AnfragenData) => void,
  onViewDetails?: (inquiry: AnfragenData) => void,
  onExpressInterest?: (inquiry: AnfragenData) => void,
  canExpressInterest?: (inquiry: AnfragenData) => boolean
): ColumnDef<AnfragenData>[] {
  const t = useTranslations("Dashboard.customerInquiries");
  const currentLocale = useLocale();

  // Helper functions
  const getDeadline = (match: AnfragenData): string => {
    if (match.order?.deadline) {
      return new Date(match.order.deadline).toLocaleDateString(
        currentLocale === "de" ? "de-DE" : "en-US"
      );
    }
    return t("notSpecified");
  };

  const getLocation = (match: AnfragenData): string => {
    if (match.order?.serviceAddress) {
      return `${match.order.serviceAddress.city}`;
    }
    return t("notSpecified");
  };

  const getStatusBadge = (match: AnfragenData) => {
    // Show assigned badge if a provider has already been selected for this order
    if (
      match.order?.providerId ||
      match.order?.status === "IN_PROGRESS" ||
      match.order?.status === "COMPLETED"
    ) {
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-700">
          {t("status.assigned")}
        </Badge>
      );
    }
    if (match.isHighQuality) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-700">
          {t("status.strongMatch")}
        </Badge>
      );
    } else if (match.viewed) {
      return (
        <Badge variant="outline" className="bg-blue-100 text-blue-700">
          {t("status.viewed")}
        </Badge>
      );
    } else {
      return (
        <Badge variant="default" className="bg-amber-100 text-amber-700">
          {t("status.new")}
        </Badge>
      );
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 0.7) return "text-green-600";
    if (score >= 0.5) return "text-yellow-600";
    return "text-red-600";
  };

  const formatScore = (score: number): string => {
    return `${Math.round(score * 100)}%`;
  };

  return [
    {
      id: "title",
      header: t("table.inquiryTitle"),
      accessorFn: (row) => row.order?.title || t("table.noTitle"),
      cell: ({ getValue, row }) => (
        <div className="font-medium text-gray-900">{getValue() as string}</div>
      ),
      sortable: true,
      searchable: true,
    },
    {
      id: "client",
      header: t("table.client"),
      accessorFn: (row) => row.order?.companyName || t("table.unknown"),
      cell: ({ getValue }) => (
        <div className="text-gray-700">{getValue() as string}</div>
      ),
      sortable: true,
      searchable: true,
    },
    {
      id: "location",
      header: t("table.location"),
      accessorFn: (row) => getLocation(row),
      cell: ({ getValue }) => (
        <div className="text-gray-700">{getValue() as string}</div>
      ),
      sortable: true,
    },
    {
      id: "completion",
      header: t("table.completion"),
      accessorFn: (row) => getDeadline(row),
      cell: ({ getValue }) => (
        <div className="text-gray-700">{getValue() as string}</div>
      ),
      sortable: true,
    },
    {
      id: "matchScore",
      header: t("table.matchScore"),
      accessorKey: "matchScore",
      cell: ({ getValue, row }) => {
        const score = getValue() as number;
        const percentage = row.matchScorePercentage;
        return (
          <div className="flex items-center gap-2">
            <Progress value={percentage} className="h-2 w-16" />
            <span className={`text-sm font-medium ${getScoreColor(score)}`}>
              {formatScore(score)}
            </span>
          </div>
        );
      },
      sortable: true,
    },
    {
      id: "interest",
      header: t("table.myInterest"),
      accessorKey: "interested",
      cell: ({ getValue }) => {
        const interested = getValue() as boolean;
        return interested ? (
          <Badge variant="outline" className="bg-blue-100 text-blue-700">
            {t("interest.requested")}
          </Badge>
        ) : (
          <span className="text-gray-400">—</span>
        );
      },
      align: "center",
    },
    {
      id: "status",
      header: t("table.status"),
      cell: ({ row }) => getStatusBadge(row),
      align: "center",
    },
    {
      id: "actions",
      header: t("table.actions"),
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails?.(row)}
            className="border-gray-200"
          >
            <Eye className="h-4 w-4 mr-1" />
            {t("actions.view")}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onView?.(row)}>
                <Eye className="h-4 w-4 mr-2" />
                {t("actions.viewDetails")}
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!canExpressInterest?.(row)}
                onClick={() => onExpressInterest?.(row)}
              >
                <Send className="h-4 w-4 mr-2" />
                {t("actions.interest")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
      align: "right",
      sortable: false,
      filterable: false,
      searchable: false,
    },
  ];
}
