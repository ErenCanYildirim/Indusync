"use client"; // Ensure it's a client component

import * as React from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusCircle, FileText } from "lucide-react";
import { MatchingPreviewButton } from "@/components/orders/MatchingPreviewButton";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

// Import DataTable and order columns
import { DataTable } from "@/components/ui/data-table";
import { useOrderColumns } from "@/components/tables/order-columns";

// Import backend hooks and types
import { useMyOrders } from "@/lib/hooks/useOrders";
import { usePermissions } from "@/lib/hooks/usePermissions";
import type { OrderStatus } from "@/lib/api/types";

const ITEMS_PER_PAGE = 10;

export default function AuftraegePage() {
  const router = useRouter();
  const t = useTranslations("Dashboard.orders");
  const { canCreateOrders, canUseMatchingPreview, isClient, isProvider } =
    usePermissions();

  // Determine default role perspective. If user has only one role, lock to it.
  const [isAuftraggeber, setIsAuftraggeber] = useState<boolean>(true);

  useEffect(() => {
    // If user is strictly client → show client view
    if (isClient && !isProvider) {
      setIsAuftraggeber(true);
      return;
    }
    // If user is strictly provider → show provider view (hide matches, applications)
    if (!isClient && isProvider) {
      setIsAuftraggeber(false);
      return;
    }
    // If user has both roles we keep the current toggle state (default stays client)
  }, [isClient, isProvider]);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");

  // Use selected perspective for fetching, if both roles are present
  const role = isClient && isProvider ? (isAuftraggeber ? "client" : "provider") : isClient ? "client" : "provider";
  const {
    data: ordersResponse,
    isLoading,
    error,
  } = useMyOrders(role, {
    page: 0,
    size: 10, // Get more data for client-side operations
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  // Prepare data for DataTable
  const orders = React.useMemo(() => {
    return (ordersResponse as any)?.content || [];
  }, [ordersResponse]);

  // Create order columns with action handlers
  const columns = useOrderColumns(
    isAuftraggeber,
    // onView
    (order) => router.push(`/dashboard/auftraege/${order.id}`),
    // onEdit
    (order) => router.push(`/dashboard/auftraege/${order.id}/edit`),
    // onDelete - only for drafts and cancelled orders
    undefined, // We'll implement this later if needed
    // onDuplicate - only for Auftraggeber
    undefined, // We'll implement this later if needed
    // onMatches - only for Auftraggeber
    (order) => router.push(`/dashboard/auftraege/${order.id}/matches`)
  );

  // Custom filters for the abgeschlossen design format
  const customFilters = (
    <>
      {/* Role Toggle - only show if user has both roles */}
      {isClient && isProvider && (
        <Select
          value={isAuftraggeber ? "client" : "provider"}
          onValueChange={(value) => setIsAuftraggeber(value === "client")}
        >
          <SelectTrigger className="w-[180px] border-gray-200">
            <SelectValue placeholder={t("roleSelection")} />
          </SelectTrigger>
          <SelectContent>
            {isClient && (
              <SelectItem value="client">{t("asClient")}</SelectItem>
            )}
            {isProvider && (
              <SelectItem value="provider">{t("asProvider")}</SelectItem>
            )}
          </SelectContent>
        </Select>
      )}

      {/* Status Filter */}
      <Select
        value={statusFilter}
        onValueChange={(value) => setStatusFilter(value as OrderStatus | "all")}
      >
        <SelectTrigger className="w-[180px] border-gray-200">
          <SelectValue placeholder={t("statusSelection")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("allStatuses")}</SelectItem>
          <SelectItem value="DRAFT">{t("draft")}</SelectItem>
          <SelectItem value="PUBLISHED">{t("published")}</SelectItem>
          <SelectItem value="MATCHED">{t("matched")}</SelectItem>
          <SelectItem value="IN_PROGRESS">{t("inProgress")}</SelectItem>
          <SelectItem value="COMPLETED">{t("completed")}</SelectItem>
          <SelectItem value="CANCELLED">{t("cancelled")}</SelectItem>
        </SelectContent>
      </Select>
    </>
  );

  return (
    <div className="container px-4 sm:px-6">
      {/* Action Buttons - positioned above the DataTable */}
      <div className="flex justify-end gap-2 mb-4">
        {/* Only show matching preview button if user can use it */}
        {canUseMatchingPreview && (
          <MatchingPreviewButton variant="outline" size="default" />
        )}

        {/* Only show create order button for AG-only companies or companies with both roles */}
        {/* Hide for AN-only companies (as per requirement 4.2) */}
        {canCreateOrders && (
          <Link href="/auftrag-erstellen">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              {t("newOrder")}
            </Button>
          </Link>
        )}
      </div>

      <DataTable
        description={
          isAuftraggeber ? t("clientDescription") : t("providerDescription")
        }
        icon={<FileText className="h-5 w-5 text-blue-600" />}
        customFilters={customFilters}
        cardLayout={true}
        // Data and functionality
        data={orders}
        columns={columns}
        loading={isLoading}
        error={error ? t("loadError") : null}
        emptyMessage={t("noOrdersAvailable")}
        enableSorting={true}
        enableSearch={true}
        enablePagination={true}
        pageSize={ITEMS_PER_PAGE}
      />
    </div>
  );
}
