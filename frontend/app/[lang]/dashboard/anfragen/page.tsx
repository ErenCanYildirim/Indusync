"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { FileSearch, Search } from "lucide-react";
import {
  useMatchedOrders,
  useOrderBoardFilters,
  useMatchScoreUtils,
  useMarkOrderViewed,
  useExpressInterest,
} from "@/lib/hooks/useOrderBoard";
import type { OrderMatchResponse } from "@/lib/api/types";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { useTranslations, useLocale } from "next-intl";

// Import DataTable and anfragen columns
import { DataTable } from "@/components/ui/data-table";
import {
  useAnfragenColumns,
  AnfragenData,
} from "@/components/tables/anfragen-columns";

export default function AnfragenPage() {
  const [selectedMatch, setSelectedMatch] = useState<OrderMatchResponse | null>(
    null
  );
  const [confirmInterestFor, setConfirmInterestFor] = useState<string | null>(
    null
  );
  const [statusFilter, setStatusFilter] = useState<
    "all" | "unviewed" | "highQuality"
  >("all");
  const [scoreFilter, setScoreFilter] = useState<number>(0);

  const t = useTranslations("Dashboard.customerInquiries");
  const currentLocale = useLocale();

  // Use order board filters hook for managing pagination and filters
  const { filters, setPage, setMinScore, setUnviewedOnly } =
    useOrderBoardFilters({
      page: 0,
      size: 10,
      minScore: scoreFilter,
      unviewedOnly: statusFilter === "unviewed",
    });

  // Fetch matched orders using the new hook
  const { data: orderBoardData, isLoading, error } = useMatchedOrders(filters);

  // Match score utilities
  const { getScoreColor, getMatchQuality, formatScore } = useMatchScoreUtils();

  const router = useRouter();
  const markViewed = useMarkOrderViewed();
  const expressInterest = useExpressInterest();

  // Helper functions for the detail sheet
  const getDeadline = (match: OrderMatchResponse): string => {
    if (match.order?.deadline) {
      return new Date(match.order.deadline).toLocaleDateString(
        currentLocale === "de" ? "de-DE" : "en-US"
      );
    }
    return t("notSpecified");
  };

  const getLocation = (match: OrderMatchResponse): string => {
    if (match.order?.serviceAddress) {
      return `${match.order.serviceAddress.city}`;
    }
    return t("notSpecified");
  };

  // Prepare data for DataTable
  const matchedOrders = (orderBoardData?.content || []) as AnfragenData[];

  // Determine if provider can still express interest
  const canExpressInterest = (inquiry: AnfragenData) =>
    !inquiry.interested &&
    (inquiry.order?.status === "PUBLISHED" ||
      inquiry.order?.status === "MATCHED");

  // Action handlers
  const handleView = (inquiry: AnfragenData) => {
    router.push(`/dashboard/auftraege/${inquiry.orderId}`);
  };

  const handleViewDetails = (inquiry: AnfragenData) => {
    setSelectedMatch(inquiry);
    if (!inquiry.viewed) {
      markViewed.mutate(inquiry.orderId);
    }
  };

  const handleExpressInterest = (inquiry: AnfragenData) => {
    setConfirmInterestFor(inquiry.orderId);
  };

  // Create columns with action handlers
  const columns = useAnfragenColumns(
    handleView,
    handleViewDetails,
    handleExpressInterest,
    canExpressInterest
  );

  // Custom filters for the abgeschlossen design format
  const customFilters = (
    <>
      {/* Status Filter */}
      <Select
        value={statusFilter}
        onValueChange={(value) => {
          setStatusFilter(value as "all" | "unviewed" | "highQuality");
          if (value === "unviewed") {
            setUnviewedOnly(true);
          } else {
            setUnviewedOnly(false);
          }
        }}
      >
        <SelectTrigger className="w-[180px] border-gray-200">
          <SelectValue placeholder={t("filters.filter")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("filters.allInquiries")}</SelectItem>
          <SelectItem value="unviewed">{t("filters.unviewed")}</SelectItem>
          <SelectItem value="highQuality">
            {t("filters.highQuality")}
          </SelectItem>
        </SelectContent>
      </Select>

      {/* Score Filter */}
      <Select
        value={scoreFilter.toString()}
        onValueChange={(value) => {
          const score = parseFloat(value);
          setScoreFilter(score);
          setMinScore(score);
        }}
      >
        <SelectTrigger className="w-[160px] border-gray-200">
          <SelectValue placeholder={t("filters.minScore")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="0">{t("filters.allScores")}</SelectItem>
          <SelectItem value="0.3">{t("filters.score30Plus")}</SelectItem>
          <SelectItem value="0.5">{t("filters.score50Plus")}</SelectItem>
          <SelectItem value="0.7">{t("filters.score70Plus")}</SelectItem>
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
        icon={<FileSearch className="h-5 w-5 text-blue-600" />}
        customFilters={customFilters}
        cardLayout={true}
        // Data and functionality
        data={matchedOrders}
        columns={columns}
        loading={isLoading}
        error={error ? error?.message || t("error.unknown") : null}
        emptyMessage={t("emptyState")}
        enableSorting={true}
        enableSearch={true}
        enablePagination={true}
        pageSize={10}
        // Server-side pagination support
        serverSide={true}
        totalCount={orderBoardData?.totalElements || 0}
        onPageChange={(page) => setPage(page)}
      />

      {/* Match Detail Drawer */}
      <Sheet open={!!selectedMatch} onOpenChange={() => setSelectedMatch(null)}>
        <SheetContent className="w-[400px] sm:w-[500px]">
          {selectedMatch && (
            <div className="space-y-6 p-4">
              <SheetHeader>
                <SheetTitle>
                  {selectedMatch.order?.title || t("details.title")}
                </SheetTitle>
              </SheetHeader>

              <div className="space-y-2 text-sm">
                <p>
                  <strong>{t("details.client")}:</strong>{" "}
                  {selectedMatch.order?.companyName ?? t("table.unknown")}
                </p>
                <p>
                  <strong>{t("details.location")}:</strong>{" "}
                  {getLocation(selectedMatch)}
                </p>
                <p>
                  <strong>{t("details.completionDate")}:</strong>{" "}
                  {getDeadline(selectedMatch)}
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-medium">
                  {t("details.matchScore")}
                </h3>
                <Progress value={selectedMatch.matchScorePercentage} />
                <p
                  className={`text-sm ${getScoreColor(
                    selectedMatch.matchScore
                  )}`}
                >
                  {formatScore(selectedMatch.matchScore)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("details.quality")}:{" "}
                  {getMatchQuality(selectedMatch.matchScore)}
                </p>
              </div>

              <div className="space-y-2 text-sm">
                <h3 className="text-sm font-medium mb-1">
                  {t("details.scoreBreakdown")}
                </h3>
                <p>
                  {t("details.industry")}:{" "}
                  {(selectedMatch.industryScore ?? 0).toFixed(2)}
                </p>
                <p>
                  {t("details.skills")}:{" "}
                  {(selectedMatch.skillsScore ?? 0).toFixed(2)}
                </p>
                <p>
                  {t("details.certificates")}:{" "}
                  {(selectedMatch.certificatesScore ?? 0).toFixed(2)}
                </p>
                <p>
                  {t("details.radius")}:{" "}
                  {(selectedMatch.radiusScore ?? 0).toFixed(2)}
                </p>
              </div>

              <Button
                className="w-full"
                onClick={() =>
                  router.push(
                    `/dashboard/anfragen/projekt/${selectedMatch.orderId}`
                  )
                }
              >
                {t("details.viewFullDetails")}
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Confirm interest dialog */}
      <AlertDialog
        open={!!confirmInterestFor}
        onOpenChange={(open) => !open && setConfirmInterestFor(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirmInterest.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("confirmInterest.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("confirmInterest.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmInterestFor) {
                  expressInterest.mutate(confirmInterestFor);
                  setConfirmInterestFor(null);
                }
              }}
            >
              {t("confirmInterest.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
