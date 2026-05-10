"use client";

/**
 * Order List Component
 * Displays a paginated, filterable list of orders with status management
 *
 * @author IndusSync Frontend Team
 *
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { useTranslations, useFormatter } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Eye,
  Edit,
  Send,
  Trash2,
  MoreHorizontal,
  MapPin,
  Calendar,
  Loader2,
} from "lucide-react";
import {
  useMyOrders,
  usePublishOrder,
  useCancelOrder,
} from "@/lib/hooks/useOrders";
import type { OrderStatus, PaginationParams } from "@/lib/api/types";

interface OrderListProps {
  onCreateOrder?: () => void;
  onEditOrder?: (orderId: string) => void;
  onViewOrder?: (orderId: string) => void;
}

const statusColors: Record<OrderStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  PUBLISHED: "bg-blue-100 text-blue-800",
  MATCHED: "bg-yellow-100 text-yellow-800",
  IN_PROGRESS: "bg-orange-100 text-orange-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export default function OrderList({
  onCreateOrder,
  onEditOrder,
  onViewOrder,
}: OrderListProps) {
  const router = useRouter();
  const t = useTranslations("Dashboard.orders");
  const format = useFormatter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "ALL">("ALL");
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10;

  // Build query parameters
  const queryParams: PaginationParams = {
    page: currentPage,
    size: pageSize,
    sort: "createdAt,desc",
    ...(statusFilter !== "ALL" && { status: statusFilter }),
  };

  // Fetch orders
  const { data: ordersResponse, isLoading, error } = useMyOrders(queryParams);

  // Mutations
  const publishOrderMutation = usePublishOrder();
  const cancelOrderMutation = useCancelOrder();

  const orders = ordersResponse?.data || [];
  const totalPages = ordersResponse?.totalPages || 0;
  const totalElements = ordersResponse?.totalElements || 0;

  // Filter orders locally by search query
  const filteredOrders = orders.filter(
    (order) =>
      order.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewOrder = (orderId: string) => {
    onViewOrder?.(orderId);
    router.push(`/dashboard/auftraege/${orderId}`);
  };

  const handleEditOrder = (orderId: string) => {
    onEditOrder?.(orderId);
    router.push(`/dashboard/auftraege/${orderId}/edit`);
  };

  const handlePublishOrder = async (orderId: string) => {
    try {
      await publishOrderMutation.mutateAsync(orderId);
    } catch (error) {
      console.error("Error publishing order:", error);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      await cancelOrderMutation.mutateAsync(orderId);
    } catch (error) {
      console.error("Error cancelling order:", error);
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">{t("loadingError")}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">{t("myOrders")}</h2>
          <p className="text-gray-600">
            {totalElements} {t("ordersFound")}
          </p>
        </div>

        <Button onClick={onCreateOrder}>{t("create")}</Button>
      </div>

      {/* Search and Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <Input
            placeholder={t("searchOrders")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(value) =>
            setStatusFilter(value as OrderStatus | "ALL")
          }
        >
          <SelectTrigger>
            <SelectValue placeholder={t("filterStatus")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t("allStatuses")}</SelectItem>
            <SelectItem value="DRAFT">{t("draft")}</SelectItem>
            <SelectItem value="PUBLISHED">{t("published")}</SelectItem>
            <SelectItem value="MATCHED">{t("matched")}</SelectItem>
            <SelectItem value="IN_PROGRESS">{t("inProgress")}</SelectItem>
            <SelectItem value="COMPLETED">{t("completed")}</SelectItem>
            <SelectItem value="CANCELLED">{t("cancelled")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-gray-500">
                {searchQuery || statusFilter !== "ALL"
                  ? t("noOrdersFound")
                  : t("noOrdersCreated")}
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredOrders.map((order) => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{order.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {order.description}
                    </CardDescription>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Badge className={statusColors[order.status]}>
                      {order.statusDisplayName}
                    </Badge>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleViewOrder(order.id)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          {t("view")}
                        </DropdownMenuItem>

                        {order.canBeModified && (
                          <DropdownMenuItem
                            onClick={() => handleEditOrder(order.id)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            {t("edit")}
                          </DropdownMenuItem>
                        )}

                        {order.isDraft && (
                          <DropdownMenuItem
                            onClick={() => handlePublishOrder(order.id)}
                            disabled={publishOrderMutation.isPending}
                          >
                            {publishOrderMutation.isPending ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4 mr-2" />
                            )}
                            {t("publish")}
                          </DropdownMenuItem>
                        )}

                        {!order.isFinal && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem
                                onSelect={(e) => e.preventDefault()}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {t("cancel")}
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  {t("cancelOrder")}
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t("confirmCancel")}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>
                                  {t("cancel")}
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleCancelOrder(order.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  {t("cancel")}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {order.location
                        ? `${order.searchRadiusKm}${t("radiusKm")}`
                        : t("locationNotAvailable")}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {t("created")}:{" "}
                      {format.dateTime(new Date(order.createdAt), {
                        dateStyle: "short",
                      })}
                    </span>
                  </div>

                  {order.publishedAt && (
                    <div className="flex items-center space-x-2">
                      <Send className="h-4 w-4" />
                      <span>
                        {t("publishedAt")}:{" "}
                        {format.dateTime(new Date(order.publishedAt), {
                          dateStyle: "short",
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 0}
          >
            {t("back")}
          </Button>

          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum =
                Math.max(0, Math.min(totalPages - 5, currentPage - 2)) + i;
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum + 1}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage >= totalPages - 1}
          >
            {t("next")}
          </Button>
        </div>
      )}
    </div>
  );
}
