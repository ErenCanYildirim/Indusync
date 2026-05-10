"use client";

import React, { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useOrderMatches } from "@/lib/hooks/useOrderMatches";
import { useSelectProvider } from "@/lib/hooks/useOrders";
import { ordersApi } from "@/lib/api/orders";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  AlertCircle,
  Users,
  TrendingUp,
  FileSearch,
  Loader2,
  ArrowUpDown,
  MoreHorizontal,
  Eye,
  Star,
  ExternalLink,
  Filter,
  Search,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import type { CompanyMatchResponse } from "@/lib/api/types";
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
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// Import DataTable and order matches columns
import { DataTable } from "@/components/ui/data-table";
import { useOrderMatchesColumns } from "@/components/tables/order-matches-columns";

const PAGE_SIZE = 20;

export default function OrderMatchesPage() {
  const params = useParams();
  const orderId = Array.isArray(params?.id)
    ? params.id[0]
    : (params?.id as string);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get("page") || "0", 10)
  );
  const [sortBy, setSortBy] = useState("matchScore");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [confirmSelectFor, setConfirmSelectFor] = useState<string | null>(null);
  const [qualityFilter, setQualityFilter] = useState<
    "all" | "high" | "interested"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const t = useTranslations("Dashboard.orderMatches");

  // Fetch order details
  const {
    data: orderData,
    isLoading: orderLoading,
    error: orderError,
  } = useQuery({
    queryKey: ["orders", "detail", orderId],
    queryFn: () => ordersApi.getOrder(orderId),
    enabled: !!orderId,
  });

  // Fetch matches with pagination
  const matchesQuery = useOrderMatches(orderId, {
    page: currentPage,
    size: PAGE_SIZE,
    sort: `${sortBy},${sortDirection}`,
  });

  const {
    data: matchesResponse,
    isLoading: matchesLoading,
    error: matchesError,
    refetch: refetchMatches,
  } = matchesQuery;

  const matches = matchesResponse?.data || [];
  const totalPages = matchesResponse?.totalPages || 0;
  const totalElements = matchesResponse?.totalElements || 0;
  const providerSelected = matches.some((m) => m.accepted);

  const canSelectProvider =
    orderData?.status === "PUBLISHED" || orderData?.status === "MATCHED";

  const selectProvider = useSelectProvider();

  // Filter matches based on quality filter and search query
  const filteredMatches = React.useMemo(() => {
    let filtered = matches.filter((match) => {
      switch (qualityFilter) {
        case "high":
          return match.isHighQuality;
        case "interested":
          return match.interested;
        default:
          return true;
      }
    });

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((match) => {
        const companyName = match.company?.companyName?.toLowerCase() || "";
        const companyType = match.company?.companyType?.toLowerCase() || "";
        const address = match.company?.formattedAddress?.toLowerCase() || "";
        const city = match.company?.city?.toLowerCase() || "";

        return (
          companyName.includes(query) ||
          companyType.includes(query) ||
          address.includes(query) ||
          city.includes(query)
        );
      });
    }

    return filtered;
  }, [matches, qualityFilter, searchQuery]);

  // Action handlers
  const handleViewProfile = (match: CompanyMatchResponse) => {
    router.push(`/dashboard/dienstleister/${match.providerId}`);
  };

  const handleViewOrder = (match: CompanyMatchResponse) => {
    router.push(`/dashboard/auftraege/${orderId}`);
  };

  const handleSelectProvider = (match: CompanyMatchResponse) => {
    setConfirmSelectFor(match.providerId);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    const url = new URL(window.location.href);
    url.searchParams.set("page", newPage.toString());
    router.push(url.pathname + url.search);
  };

  const handleSortChange = (sortConfig: {
    column: string;
    direction: "asc" | "desc";
  }) => {
    setSortBy(sortConfig.column);
    setSortDirection(sortConfig.direction);
    setCurrentPage(0); // Reset to first page when sorting changes
  };

  // Create columns with action handlers
  const columns = useOrderMatchesColumns(
    handleViewProfile,
    handleViewOrder,
    handleSelectProvider,
    canSelectProvider,
    providerSelected
  );

  // Custom filters for the abgeschlossen design format
  const customFilters = (
    <>
      {/* Quality Filter */}
      <Select
        value={qualityFilter}
        onValueChange={(value) =>
          setQualityFilter(value as "all" | "high" | "interested")
        }
      >
        <SelectTrigger className="w-[180px] border-gray-200">
          <SelectValue placeholder={t("filters.selectQuality")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("filters.allMatches")}</SelectItem>
          <SelectItem value="high">{t("filters.highQuality")}</SelectItem>
          <SelectItem value="interested">{t("filters.interested")}</SelectItem>
        </SelectContent>
      </Select>
    </>
  );

  if (orderError || matchesError) {
    return (
      <div className="container px-4 sm:px-6 space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-1" /> {t("navigation.back")}
          </Button>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {orderError
              ? t("errors.orderLoadFailed")
              : t("errors.matchesLoadFailed")}
            <Button
              variant="outline"
              size="sm"
              className="ml-2"
              onClick={() =>
                orderError ? window.location.reload() : refetchMatches?.()
              }
            >
              {t("actions.reload")}
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container px-4 sm:px-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" /> {t("navigation.back")}
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          {orderData && (
            <p className="text-muted-foreground">
              {t("subtitle", { orderTitle: orderData.title })}
            </p>
          )}
        </div>
      </div>

      {/* Order Summary Card */}
      {orderLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-6">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
          </CardContent>
        </Card>
      ) : orderData ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>{orderData.title}</span>
              <Badge variant="outline">{orderData.status}</Badge>
            </CardTitle>
            <CardDescription>{orderData.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>
                  {orderData.serviceAddress?.city},{" "}
                  {orderData.serviceAddress?.postalCode}
                </span>
              </div>
              {orderData.budget && (
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {t("orderSummary.budget", {
                      amount: orderData.budget.toLocaleString(),
                    })}
                  </span>
                </div>
              )}
              {orderData.deadline && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {t("orderSummary.deadline", {
                      date: new Date(orderData.deadline).toLocaleDateString(
                        "de-DE"
                      ),
                    })}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* DataTable with clean design - No internal scrolling */}
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col space-y-4">
          <div>
            {/* <h2 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
              <div className="bg-emerald-100 p-2 rounded-lg">
                <FileSearch className="h-5 w-5 text-blue-600" />
              </div>
              {t("matchesTable.title")}
              {totalElements > 0 && (
                <Badge variant="outline" className="ml-2">
                  {totalElements}
                </Badge>
              )}
            </h2> */}
            {/* <p className="text-gray-600 mt-2">
              {t("matchesTable.description")}
            </p> */}
          </div>
        </div>

        {/* Main Content Card */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="border-b border-gray-100 bg-gray-50/50">
            <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
              <CardTitle className="text-xl">
                {t("matchesTable.title")}
                {totalElements > 0 && (
                  <Badge variant="outline" className="ml-2">
                    {totalElements}
                  </Badge>
                )}
              </CardTitle>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Filter className="h-4 w-4" />
                  <span>Filter:</span>
                </div>

                {/* Custom filters */}
                {customFilters}

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    type="search"
                    placeholder={t("table.search") || "Search..."}
                    className="w-64 pl-9 border-gray-200"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {/* Handle loading state */}
            {matchesLoading ? (
              <div className="p-6">
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex space-x-4">
                      {Array.from({ length: columns.length }).map((_, j) => (
                        <div
                          key={j}
                          className="h-4 bg-gray-200 rounded flex-1 animate-pulse"
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ) : matchesError ? (
              /* Handle error state */
              <div className="p-6">
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="text-red-600 mb-4">
                    {t("errors.matchesLoadFailed")}
                  </div>
                  {/* <Button onClick={() => refetchMatches?.()} variant="outline">
                    {t("actions.reload")}
                  </Button> */}
                </div>
              </div>
            ) : filteredMatches.length === 0 ? (
              /* Handle empty state */
              <div className="p-6">
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="h-12 w-12 text-gray-400 mb-4" />
                  <div className="text-gray-600">{t("emptyState")}</div>
                </div>
              </div>
            ) : (
              <>
                {/* Desktop Table View - No internal scrolling */}
                <div className="hidden lg:block">
                  <Table className="border-0">
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-b border-gray-100">
                        {columns.map((column) => (
                          <TableHead
                            key={column.id}
                            className={cn(
                              "font-semibold text-gray-700",
                              column.align === "center" && "text-center",
                              column.align === "right" && "text-right",
                              column.className
                            )}
                          >
                            {column.sortable ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto p-0 font-semibold text-gray-700 hover:text-gray-900"
                                onClick={() => {
                                  const currentDirection =
                                    sortBy === column.id ? sortDirection : null;
                                  const newDirection =
                                    currentDirection === "asc" ? "desc" : "asc";
                                  handleSortChange({
                                    column: column.id,
                                    direction: newDirection,
                                  });
                                }}
                              >
                                {typeof column.header === "string"
                                  ? column.header
                                  : column.header({
                                      column,
                                      sortDirection: null,
                                    })}
                                {sortBy === column.id &&
                                  (sortDirection === "asc" ? (
                                    <ChevronUp className="ml-1 h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="ml-1 h-4 w-4" />
                                  ))}
                              </Button>
                            ) : typeof column.header === "string" ? (
                              column.header
                            ) : (
                              column.header({ column, sortDirection: null })
                            )}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMatches.map((row, index) => (
                        <TableRow
                          key={index}
                          className="hover:bg-gray-50/50 border-b border-gray-50"
                        >
                          {columns.map((column) => (
                            <TableCell
                              key={column.id}
                              className={cn(
                                column.align === "center" && "text-center",
                                column.align === "right" && "text-right",
                                column.className
                              )}
                            >
                              {column.cell
                                ? column.cell({
                                    getValue: () => {
                                      if (column.accessorFn) {
                                        return column.accessorFn(row);
                                      }
                                      if (column.accessorKey) {
                                        return (row as any)[column.accessorKey];
                                      }
                                      return null;
                                    },
                                    row,
                                    column,
                                  })
                                : column.accessorFn
                                ? column.accessorFn(row)
                                : column.accessorKey
                                ? (row as any)[column.accessorKey]
                                : null}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Card View */}
                <div className="lg:hidden p-4 space-y-4">
                  {filteredMatches.map((row, index) => (
                    <Card key={index} className="border border-gray-200">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          {/* Company Name */}
                          <div className="font-semibold text-base">
                            {row.company?.companyName ||
                              `Provider ${row.providerId.slice(0, 8)}...`}
                          </div>

                          {/* Score and Address */}
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <div className="text-gray-500 text-xs mb-1">
                                Score
                              </div>
                              <Badge variant="outline">
                                {Math.round(row.matchScore * 100)}%
                              </Badge>
                            </div>
                            <div>
                              <div className="text-gray-500 text-xs mb-1">
                                Status
                              </div>
                              <div className="flex items-center gap-1">
                                <div
                                  className={`w-2 h-2 rounded-full ${
                                    row.viewedAt
                                      ? "bg-green-500"
                                      : "bg-gray-400"
                                  }`}
                                ></div>
                                <span className="text-sm">
                                  {row.viewedAt
                                    ? t("status.viewed")
                                    : t("status.notViewed")}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex justify-end pt-2 border-t">
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewProfile(row)}
                              >
                                {t("actions.profile")}
                              </Button>
                              {row.interested &&
                                canSelectProvider &&
                                !providerSelected &&
                                !row.accepted && (
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => handleSelectProvider(row)}
                                  >
                                    {t("actions.select")}
                                  </Button>
                                )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between p-6 border-t border-gray-100">
                    <div className="text-sm text-gray-600">
                      Page {currentPage + 1} of {totalPages} ({totalElements}{" "}
                      matches total)
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 0}
                      >
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Previous
                      </Button>

                      {/* Page numbers */}
                      <div className="flex items-center gap-1">
                        {Array.from(
                          { length: Math.min(5, totalPages) },
                          (_, i) => {
                            let pageNumber;
                            if (totalPages <= 5) {
                              pageNumber = i;
                            } else if (currentPage < 3) {
                              pageNumber = i;
                            } else if (currentPage > totalPages - 3) {
                              pageNumber = totalPages - 5 + i;
                            } else {
                              pageNumber = currentPage - 2 + i;
                            }

                            return (
                              <Button
                                key={pageNumber}
                                variant={
                                  pageNumber === currentPage
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() => handlePageChange(pageNumber)}
                                className="w-8 h-8"
                              >
                                {pageNumber + 1}
                              </Button>
                            );
                          }
                        )}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages - 1}
                      >
                        Next
                        <ArrowLeft className="h-4 w-4 ml-1 rotate-180" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirm provider selection dialog */}
      <AlertDialog
        open={!!confirmSelectFor}
        onOpenChange={(open) => !open && setConfirmSelectFor(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirmDialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("confirmDialog.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("confirmDialog.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmSelectFor) {
                  selectProvider.mutate({
                    orderId,
                    providerId: confirmSelectFor,
                  });
                  setConfirmSelectFor(null);
                }
              }}
            >
              {t("confirmDialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
