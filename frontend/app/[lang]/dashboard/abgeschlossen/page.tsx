"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle, Eye, Loader2, Building, Star } from "lucide-react";

// Reusable DataTable and helpers
import {
  DataTable,
  type ColumnDef,
  createDateColumn,
  createCurrencyColumn,
} from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { TableActions } from "@/components/ui/table-actions";

// Backend integration hooks
import { useMyCompletedOrders } from "@/lib/hooks/useOrders";
import { useAuth } from "@/lib/hooks/useAuth";
import { useOrderReviewStatus } from "@/lib/hooks/useReviews";
import type { OrderListResponse } from "@/lib/api/types";
import { useTranslations, useLocale } from "next-intl";

// Extended type for orders with user role
interface ExtendedOrder extends OrderListResponse {
  userRole: "client" | "provider";
}

// Review Status Button Component
function ReviewStatusButton({
  order,
  userCompanyId,
}: {
  order: ExtendedOrder;
  userCompanyId?: string;
}) {
  const { data: reviewStatus, isLoading } = useOrderReviewStatus(
    order.id,
    userCompanyId
  );
  const t = useTranslations("Dashboard.completedOrders.review");

  if (isLoading) {
    return (
      <Button size="sm" disabled className="bg-gray-100">
        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
        {t("loading")}
      </Button>
    );
  }

  if (!reviewStatus) {
    return (
      <Button size="sm" asChild className="bg-amber-600 hover:bg-amber-700">
        <Link href={`/dashboard/abgeschlossen/review/${order.id}`}>
          <Star className="h-4 w-4 mr-1" />
          {t("rate")}
        </Link>
      </Button>
    );
  }

  if (reviewStatus.hasUserReviewed) {
    return (
      <Button size="sm" asChild className="bg-green-600 hover:bg-green-700">
        <Link href={`/dashboard/abgeschlossen/review/${order.id}`}>
          <CheckCircle className="h-4 w-4 mr-1" />
          {reviewStatus.hasOtherReviewed ? t("allReviews") : t("rated")}
        </Link>
      </Button>
    );
  }

  return (
    <Button size="sm" asChild className="bg-amber-600 hover:bg-amber-700">
      <Link href={`/dashboard/abgeschlossen/review/${order.id}`}>
        <Star className="h-4 w-4 mr-1" />
        {t("rate")}
      </Link>
    </Button>
  );
}

export default function CompletedOrdersPage() {
  const router = useRouter();
  const [filterYear, setFilterYear] = React.useState("all");
  const [roleFilter, setRoleFilter] = React.useState<
    "all" | "client" | "provider"
  >("all");

  const { user } = useAuth();
  const t = useTranslations("Dashboard.completedOrders");
  const tReview = useTranslations("Dashboard.completedOrders.review");
  const currentLocale = useLocale();
  const itemsPerPage = 10;

  // Fetch orders from backend - fetch all orders for both roles
  const {
    data: clientOrdersResponse,
    isLoading: clientLoading,
    error: clientError,
  } = useMyCompletedOrders("client", {
    page: 0,
    size: 100,
  });

  const {
    data: providerOrdersResponse,
    isLoading: providerLoading,
    error: providerError,
  } = useMyCompletedOrders("provider", {
    page: 0,
    size: 100,
  });

  const isLoading = clientLoading || providerLoading;
  const hasError = clientError || providerError;

  // Combine orders from both roles - handle the correct data structure
  const allOrders: ExtendedOrder[] = React.useMemo(
    () => [
      ...((clientOrdersResponse as any)?.content || []).map(
        (order: OrderListResponse) => ({
          ...order,
          userRole: "client" as const,
        })
      ),
      ...((providerOrdersResponse as any)?.content || []).map(
        (order: OrderListResponse) => ({
          ...order,
          userRole: "provider" as const,
        })
      ),
    ],
    [clientOrdersResponse, providerOrdersResponse]
  );

  // All orders are already completed from the new endpoint, no need to filter by status
  const completedOrders = allOrders;

  // Apply role/year filters client-side
  const filteredOrders = React.useMemo(() => {
    return completedOrders.filter((order) => {
      const matchesYear =
        filterYear === "all" ||
        (order.deadline &&
          new Date(order.deadline).getFullYear().toString() === filterYear);

      const matchesRole = roleFilter === "all" || order.userRole === roleFilter;

      return matchesYear && matchesRole;
    });
  }, [completedOrders, filterYear, roleFilter]);

  const getRoleDisplayName = React.useCallback(
    (role: "client" | "provider") => {
      return role === "client" ? t("roles.client") : t("roles.provider");
    },
    [t]
  );

  const getOtherPartyName = React.useCallback(
    (order: ExtendedOrder) => {
      return order.companyName || t("table.unknown");
    },
    [t]
  );

  // Define columns for DataTable
  const columns = React.useMemo<ColumnDef<ExtendedOrder>[]>(() => {
    return [
      {
        id: "title",
        header: t("table.order"),
        accessorKey: "title",
        cell: ({ getValue, row }) => (
          <div className="max-w-[280px]">
            <div className="font-medium text-gray-900 truncate">
              {(getValue() as string) || t("table.untitledOrder")}
            </div>
            <div className="text-xs text-gray-500">
              {t("table.id")}: {row.id?.slice(0, 8)}...
            </div>
          </div>
        ),
        sortable: true,
        searchable: true,
      },
      {
        id: "company",
        header: t("table.company"),
        accessorFn: (row) => getOtherPartyName(row),
        cell: ({ getValue }) => (
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-gray-400" />
            <span className="text-gray-700 truncate max-w-[220px]">
              {getValue() as string}
            </span>
          </div>
        ),
        sortable: true,
        searchable: true,
      },
      {
        id: "role",
        header: t("table.role"),
        accessorKey: "userRole",
        cell: ({ getValue }) => (
          <Badge variant="outline" className="border-gray-200 text-gray-700">
            {getRoleDisplayName(getValue() as "client" | "provider")}
          </Badge>
        ),
        sortable: false,
        filterable: false,
      },
      {
        ...createDateColumn<ExtendedOrder>("deadline", {
          header: t("table.completionDate"),
          format: "short",
        }),
        id: "completionDate",
      },
      // {
      //   ...createCurrencyColumn<ExtendedOrder>("budget", {
      //     header: t("table.budget"),
      //     currency: "EUR",
      //   }),
      //   id: "budget",
      // },
      {
        id: "status",
        header: t("table.status"),
        cell: () => (
          <StatusBadge variant="abgeschlossen" className="font-medium">
            {t("status.completed")}
          </StatusBadge>
        ),
        sortable: false,
      },
      {
        id: "actions",
        header: t("table.actions"),
        align: "right",
        cell: ({ row }) => (
          <TableActions
            row={row}
            actions={[
              {
                id: "view",
                label: t("actions.details") || "Details",
                icon: Eye,
                onClick: () => router.push(`/dashboard/auftraege/${row.id}`),
                variant: "ghost",
              },
              {
                id: "reviews",
                label: tReview("allReviews") || "Reviews",
                icon: CheckCircle,
                onClick: () =>
                  router.push(`/dashboard/abgeschlossen/review/${row.id}`),
                variant: "ghost",
              },
            ]}
            align="end"
          />
        ),
      },
    ];
  }, [t, getOtherPartyName, getRoleDisplayName, user]);

  // Custom filters shown in the DataTable header
  const customFilters = (
    <>
      <Select
        value={roleFilter}
        onValueChange={(value: "all" | "client" | "provider") =>
          setRoleFilter(value)
        }
      >
        <SelectTrigger className="w-[180px] border-gray-200">
          <SelectValue placeholder={t("filters.selectRole")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("filters.allRoles")}</SelectItem>
          <SelectItem value="client">{t("filters.asClient")}</SelectItem>
          <SelectItem value="provider">{t("filters.asProvider")}</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filterYear}
        onValueChange={(value) => setFilterYear(value)}
      >
        <SelectTrigger className="w-[150px] border-gray-200">
          <SelectValue placeholder={t("filters.selectYear")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("filters.allYears")}</SelectItem>
          <SelectItem value="2024">2024</SelectItem>
          <SelectItem value="2023">2023</SelectItem>
          <SelectItem value="2022">2022</SelectItem>
        </SelectContent>
      </Select>
    </>
  );

  return (
    <div className="container px-4 sm:px-6">
      <DataTable
        // Abgeschlossen design format props
        // title={t("title")}
        description={t("description")}
        icon={<CheckCircle className="h-5 w-5 text-emerald-600" />}
        customFilters={customFilters}
        cardLayout={true}
        // Data and functionality
        data={filteredOrders}
        columns={columns}
        loading={isLoading}
        error={hasError ? t("error.description") : null}
        emptyMessage={t("emptyState.default")}
        enableSorting={true}
        enableSearch={true}
        enablePagination={true}
        pageSize={itemsPerPage}
      />
    </div>
  );
}
