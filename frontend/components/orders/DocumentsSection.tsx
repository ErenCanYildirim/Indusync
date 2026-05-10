/**
 * DocumentsSection Component
 * Main documents section component for order detail pages
 * Handles document fetching, display, and download functionality
 *
 * @author IndusSync Frontend Team
 * @since Order Detail Documents Fix Implementation
 */

"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, RefreshCw, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOrderDocuments } from "@/hooks/use-order-documents";
import { useDownloadOrderDocument } from "@/hooks/use-download-order-document";
import { DocumentItem } from "./DocumentItem";
import { EmptyDocumentsState } from "./EmptyDocumentsState";

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Props for DocumentsSection component
 */
export interface DocumentsSectionProps {
  /** ID of the order to display documents for */
  orderId: string;
  /** Whether this is a backend order (true) or mock project (false) */
  isBackendOrder: boolean;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * DocumentsSection component for displaying order documents
 */
export function DocumentsSection({
  orderId,
  isBackendOrder,
  className,
}: DocumentsSectionProps) {
  // Translation hooks
  const t = useTranslations("Dashboard.orders.orderDetail.documents");

  // Hooks for document management
  const {
    documents,
    isLoading,
    error: fetchError,
    isRefreshing,
    refetch,
    clearError: clearFetchError,
  } = useOrderDocuments(orderId);

  const {
    downloadDocument,
    isDownloading,
    error: downloadError,
    clearError: clearDownloadError,
  } = useDownloadOrderDocument();

  // Combined error state
  const error = fetchError || downloadError;

  // Handle document download
  const handleDownload = React.useCallback(
    async (documentId: string, fileName: string) => {
      try {
        await downloadDocument(orderId, documentId, fileName);
      } catch (error) {
        // Error is handled by the hook
        console.error("Download failed:", error);
      }
    },
    [downloadDocument, orderId]
  );

  // Handle retry action
  const handleRetry = React.useCallback(async () => {
    clearFetchError();
    clearDownloadError();
    await refetch();
  }, [clearFetchError, clearDownloadError, refetch]);

  // Clear all errors
  const handleClearError = React.useCallback(() => {
    clearFetchError();
    clearDownloadError();
  }, [clearFetchError, clearDownloadError]);

  // Render loading skeleton
  const renderLoadingSkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="w-10 h-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="w-8 h-8 rounded" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Render error state
  const renderErrorState = () => (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>{error}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRetry}
          disabled={isRefreshing}
          className="ml-2"
        >
          {isRefreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          <span className="ml-1">{t("actions.retry")}</span>
        </Button>
      </AlertDescription>
    </Alert>
  );

  // Render documents list
  const renderDocumentsList = () => (
    <div className="space-y-3">
      {documents.map((document) => (
        <DocumentItem
          key={document.id}
          document={document}
          onDownload={handleDownload}
          isDownloading={isDownloading(document.id)}
        />
      ))}
    </div>
  );

  // Render empty state
  const renderEmptyState = () => (
    <EmptyDocumentsState isBackendOrder={isBackendOrder} />
  );

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">{t("title")}</CardTitle>
            {documents.length > 0 && (
              <span className="text-sm text-muted-foreground">
                ({documents.length})
              </span>
            )}
          </div>

          {/* Refresh button - only show if not loading initially */}
          {!isLoading && documents.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={refetch}
              disabled={isRefreshing}
              className="h-8 w-8 p-0"
            >
              <RefreshCw
                className={cn("h-4 w-4", isRefreshing && "animate-spin")}
              />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Error state */}
        {error && <div className="mb-4">{renderErrorState()}</div>}

        {/* Loading state */}
        {isLoading && !error && renderLoadingSkeleton()}

        {/* Documents list */}
        {!isLoading && !error && documents.length > 0 && renderDocumentsList()}

        {/* Empty state */}
        {!isLoading && !error && documents.length === 0 && renderEmptyState()}
      </CardContent>
    </Card>
  );
}

// =============================================================================
// DISPLAY NAME
// =============================================================================

DocumentsSection.displayName = "DocumentsSection";
