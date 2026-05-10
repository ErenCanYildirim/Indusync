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
  MessageCircle,
  MoreHorizontal,
  Star,
  Building,
} from "lucide-react";
import { useTranslations, useLocale } from "next-intl";

// Define the data type for service providers
export interface DienstleisterData {
  id: string;
  companyName: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  location?: {
    city: string;
    postalCode?: string;
    country?: string;
  };
  specializations: string[];
  rating?: number;
  reviewCount?: number;
  status: "ACTIVE" | "INACTIVE" | "PENDING";
  joinedAt: string;
  lastActive?: string;
  completedProjects?: number;
  responseTime?: string; // e.g., "2 hours", "1 day"
  verified?: boolean;
}

export function useDienstleisterColumns(
  onView?: (provider: DienstleisterData) => void,
  onContact?: (provider: DienstleisterData) => void,
  onViewProfile?: (provider: DienstleisterData) => void
): ColumnDef<DienstleisterData>[] {
  const t = useTranslations("Dashboard.serviceProviders");
  const currentLocale = useLocale();

  // Helper functions
  const formatDate = (dateString: string): string => {
    if (!dateString) return "";
    try {
      return new Date(dateString).toLocaleDateString(
        currentLocale === "de" ? "de-DE" : "en-US"
      );
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status: DienstleisterData["status"]) => {
    switch (status) {
      case "ACTIVE":
        return (
          <Badge variant="default" className="bg-green-100 text-green-700">
            {t("status.active")}
          </Badge>
        );
      case "INACTIVE":
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-700">
            {t("status.inactive")}
          </Badge>
        );
      case "PENDING":
        return (
          <Badge variant="default" className="bg-amber-100 text-amber-700">
            {t("status.pending")}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-700">
            {status}
          </Badge>
        );
    }
  };

  const getLocationString = (
    location?: DienstleisterData["location"]
  ): string => {
    if (!location) return t("table.noLocation");
    return `${location.city}${
      location.postalCode ? `, ${location.postalCode}` : ""
    }`;
  };

  const renderRating = (rating?: number, reviewCount?: number) => {
    if (!rating) return <span className="text-gray-400">—</span>;

    return (
      <div className="flex items-center gap-1">
        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        <span className="font-medium">{rating.toFixed(1)}</span>
        {reviewCount && (
          <span className="text-sm text-gray-500">({reviewCount})</span>
        )}
      </div>
    );
  };

  return [
    {
      id: "company",
      header: t("table.company"),
      accessorKey: "companyName",
      cell: ({ getValue, row }) => (
        <div className="flex items-center gap-2">
          <Building className="h-4 w-4 text-gray-400" />
          <div>
            <div className="font-medium text-gray-900">
              {getValue() as string}
              {row.verified && (
                <Badge
                  variant="outline"
                  className="ml-2 text-xs bg-blue-50 text-blue-700"
                >
                  {t("verified")}
                </Badge>
              )}
            </div>
            {row.contactPerson && (
              <div className="text-sm text-gray-500">{row.contactPerson}</div>
            )}
          </div>
        </div>
      ),
      sortable: true,
      searchable: true,
    },
    {
      id: "location",
      header: t("table.location"),
      accessorFn: (row) => getLocationString(row.location),
      cell: ({ getValue }) => (
        <div className="text-gray-700">{getValue() as string}</div>
      ),
      sortable: true,
    },
    {
      id: "specializations",
      header: t("table.specializations"),
      accessorKey: "specializations",
      cell: ({ getValue }) => {
        const specializations = getValue() as string[];
        if (!specializations || specializations.length === 0) {
          return <span className="text-gray-400">—</span>;
        }

        return (
          <div className="flex flex-wrap gap-1">
            {specializations.slice(0, 2).map((spec, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {spec}
              </Badge>
            ))}
            {specializations.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{specializations.length - 2}
              </Badge>
            )}
          </div>
        );
      },
      searchable: true,
    },
    {
      id: "rating",
      header: t("table.rating"),
      accessorKey: "rating",
      cell: ({ row }) => renderRating(row.rating, row.reviewCount),
      sortable: true,
      align: "center",
    },
    {
      id: "projects",
      header: t("table.completedProjects"),
      accessorKey: "completedProjects",
      cell: ({ getValue }) => {
        const count = getValue() as number;
        return count ? (
          <span className="font-medium">{count}</span>
        ) : (
          <span className="text-gray-400">0</span>
        );
      },
      sortable: true,
      align: "center",
    },
    {
      id: "responseTime",
      header: t("table.responseTime"),
      accessorKey: "responseTime",
      cell: ({ getValue }) => {
        const time = getValue() as string;
        return time ? (
          <span className="text-gray-700">{time}</span>
        ) : (
          <span className="text-gray-400">—</span>
        );
      },
      sortable: true,
    },
    {
      id: "status",
      header: t("table.status"),
      accessorKey: "status",
      cell: ({ getValue }) =>
        getStatusBadge(getValue() as DienstleisterData["status"]),
      align: "center",
      sortable: true,
    },
    {
      id: "joinedAt",
      header: t("table.joinedAt"),
      accessorKey: "joinedAt",
      cell: ({ getValue }) => (
        <div className="text-gray-700">{formatDate(getValue() as string)}</div>
      ),
      sortable: true,
    },
    {
      id: "actions",
      header: t("table.actions"),
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewProfile?.(row)}
            className="border-gray-200"
          >
            <Eye className="h-4 w-4 mr-1" />
            {t("actions.viewProfile")}
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
              <DropdownMenuItem onClick={() => onContact?.(row)}>
                <MessageCircle className="h-4 w-4 mr-2" />
                {t("actions.contact")}
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
