/**
 * DocumentItem Component
 * Displays individual document information with download functionality
 *
 * @author IndusSync Frontend Team
 * @since Order Detail Documents Fix Implementation
 */

"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Download, Loader2, FileText, Image, File } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatFileSize,
  formatUploadDate,
  getFileTypeIcon,
  getFileTypeIconWithColor,
  getFileTypeDescription,
  type DocumentDisplayData,
} from "@/lib/utils/document-utils";
import type { OrderDocumentDto } from "@/lib/api/types";

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Props for DocumentItem component
 */
export interface DocumentItemProps {
  /** Document data to display */
  document: OrderDocumentDto;
  /** Callback function for download action */
  onDownload: (documentId: string, fileName: string) => void;
  /** Whether download is currently in progress */
  isDownloading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// ICON MAPPING
// =============================================================================

/**
 * Map icon names to Lucide React components
 * Using only available icons with fallbacks
 */
const iconComponents = {
  FileText,
  Image,
  Sheet: FileText, // Fallback to FileText for Excel files
  Presentation: FileText, // Fallback to FileText for PowerPoint files
  Archive: File, // Fallback to File for archives
  Video: File, // Fallback to File for videos
  Music: File, // Fallback to File for audio
  File,
} as const;

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * DocumentItem component for displaying individual document information
 */
export function DocumentItem({
  document,
  onDownload,
  isDownloading = false,
  className,
}: DocumentItemProps) {
  // Translation hook
  const t = useTranslations("Dashboard.orders.orderDetail.documents");

  // Transform document data for display
  const displayData: DocumentDisplayData = React.useMemo(
    () => ({
      ...document,
      formattedSize: formatFileSize(document.fileSize),
      formattedDate: formatUploadDate(document.uploadedAt),
      fileIcon: getFileTypeIcon(document.contentType),
    }),
    [document]
  );

  // Get file type icon with color information
  const fileTypeIcon = React.useMemo(
    () => getFileTypeIconWithColor(document.contentType),
    [document.contentType]
  );

  // Get file type description
  const fileTypeDescription = React.useMemo(
    () => getFileTypeDescription(document.contentType),
    [document.contentType]
  );

  // Get the appropriate icon component
  const IconComponent =
    iconComponents[fileTypeIcon.iconName as keyof typeof iconComponents] ||
    File;

  // Handle download click
  const handleDownload = React.useCallback(() => {
    if (!isDownloading) {
      onDownload(document.id, document.originalFileName);
    }
  }, [document.id, document.originalFileName, onDownload, isDownloading]);

  // Handle keyboard navigation for download
  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleDownload();
      }
    },
    [handleDownload]
  );

  return (
    <Card
      className={cn("transition-all duration-200 hover:shadow-md", className)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* File Type Icon */}
          <div
            className={cn(
              "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
              fileTypeIcon.bgColor
            )}
            aria-hidden="true"
          >
            <IconComponent className={cn("w-5 h-5", fileTypeIcon.color)} />
          </div>

          {/* Document Information */}
          <div className="flex-1 min-w-0">
            {/* File Name */}
            <div className="flex items-start justify-between gap-2 mb-1">
              <h4
                className="text-sm font-medium text-foreground truncate"
                title={displayData.originalFileName}
              >
                {displayData.originalFileName}
              </h4>

              {/* Download Button */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDownload}
                      onKeyDown={handleKeyDown}
                      disabled={isDownloading}
                      className="flex-shrink-0 h-8 w-8 p-0 hover:bg-primary/10"
                      aria-label={`Download ${displayData.originalFileName}`}
                    >
                      {isDownloading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {isDownloading
                        ? t("actions.downloading")
                        : t("actions.download")}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* File Type Badge */}
            <div className="mb-2">
              <Badge variant="outline" className="text-xs bg-background">
                {fileTypeDescription}
              </Badge>
            </div>

            {/* Document Description (if available) */}
            {document.description && (
              <p
                className="text-xs text-muted-foreground mb-2 line-clamp-2"
                title={document.description}
              >
                {document.description}
              </p>
            )}

            {/* File Metadata */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span
                className="flex items-center gap-1"
                aria-label={`${t("fileInfo.size")}: ${
                  displayData.formattedSize
                }`}
              >
                <span className="font-medium">{displayData.formattedSize}</span>
              </span>

              <span className="text-muted-foreground/60">•</span>

              <span
                className="flex items-center gap-1"
                aria-label={`${t("fileInfo.uploadDate")}: ${
                  displayData.formattedDate
                }`}
              >
                <span>{displayData.formattedDate}</span>
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// DISPLAY NAME
// =============================================================================

DocumentItem.displayName = "DocumentItem";
