"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  X,
  FileText,
  AlertCircle,
  Loader2,
  ExternalLink,
  Calendar,
  Building2,
  Shield,
} from "lucide-react";
import {
  TermsConditionsDocument,
  formatFileSize,
} from "@/lib/types/terms-conditions";
import { companyApi } from "@/lib/api/company";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { useLocale } from "next-intl";

interface TermsConditionsViewerProps {
  document: TermsConditionsDocument | null;
  companyName: string;
  isOpen: boolean;
  onClose: () => void;
  onDownload?: () => void;
}

export function TermsConditionsViewer({
  document,
  companyName,
  isOpen,
  onClose,
  onDownload,
}: TermsConditionsViewerProps) {
  const t = useTranslations("termsConditions");
  const locale = useLocale();
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  // Tracking removed

  // Reset state when document changes or dialog closes
  useEffect(() => {
    if (!isOpen || !document) {
      setDocumentUrl(null);
      setError(null);
      setIsLoading(false);
      // no-op
      return;
    }

    // Use the document URL directly if available
    if (document.url) {
      setDocumentUrl(document.url);
      setIsLoading(false);
      // tracking removed
    } else {
      // If no URL is available, try to load it via API
      loadDocumentUrl();
    }
  }, [isOpen, document]);

  const loadDocumentUrl = async () => {
    if (!document) return;

    setIsLoading(true);
    setError(null);

    try {
      // Get secure URL for T&C document access
      const url = await companyApi.getTermsConditionsUrl(document.companyId);
      setDocumentUrl(url);
      // tracking removed
    } catch (err) {
      console.error("Error loading T&C document URL:", err);
      setError(t("error.loadFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!document || !documentUrl) return;

    setIsDownloading(true);

    try {
      // Create a temporary link to trigger download
      const link = document.createElement("a");
      link.href = documentUrl;
      link.download = document.originalFileName || document.fileName;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(t("downloadSuccess"), {
        description: t("downloadSuccessDescription", {
          fileName: document.originalFileName || document.fileName,
        }),
      });

      if (onDownload) {
        onDownload();
      }
    } catch (err) {
      console.error("Error downloading T&C document:", err);
      toast.error(t("error.downloadFailed"), {
        description: t("error.downloadFailedDescription"),
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleOpenInNewTab = () => {
    if (documentUrl) {
      window.open(documentUrl, "_blank");
    }
  };

  const formatDate = (dateString: string) => {
    return format(
      new Date(dateString),
      locale === "en" ? "MM/dd/yyyy" : "dd.MM.yyyy",
      {
        locale: locale === "en" ? enUS : de,
      }
    );
  };

  const formatDateTime = (dateString: string) => {
    return format(
      new Date(dateString),
      locale === "en" ? "MM/dd/yyyy 'at' h:mm a" : "dd.MM.yyyy 'um' HH:mm",
      {
        locale: locale === "en" ? enUS : de,
      }
    );
  };

  if (!document) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-3 text-left">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <span>{t("viewerTitle", { companyName })}</span>
            </div>
            <Badge variant="outline" className="ml-auto">
              <Shield className="h-3 w-3 mr-1" />
              {t("officialDocument")}
            </Badge>
          </DialogTitle>

          {/* Document metadata */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pt-2">
            <div className="flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              <span>{companyName}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>
                {t("lastUpdated")}: {formatDate(document.uploadedAt)}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              <span>{formatFileSize(document.fileSize)}</span>
            </div>
            {document.version > 1 && (
              <Badge variant="secondary" className="text-xs">
                {t("version")} {document.version}
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-96 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">{t("loading")}</p>
              <Skeleton className="h-64 w-full" />
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center h-96 space-y-4">
              <Alert variant="destructive" className="max-w-md">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <Button onClick={loadDocumentUrl} variant="outline">
                {t("retryLoad")}
              </Button>
            </div>
          )}

          {documentUrl && !isLoading && !error && (
            <div className="h-full overflow-auto">
              <div className="w-full h-full min-h-96">
                {/* PDF Viewer */}
                <iframe
                  src={documentUrl}
                  className="w-full h-full min-h-96 border-0 rounded-lg"
                  title={t("viewerTitle", { companyName })}
                  onError={() => setError(t("error.fileNotFound"))}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-shrink-0 border-t pt-4">
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                {document.originalFileName || document.fileName}
              </span>
              <span className="uppercase text-xs bg-muted px-2 py-1 rounded">
                PDF
              </span>
            </div>

            <div className="flex gap-2">
              {documentUrl && (
                <>
                  <Button
                    onClick={handleOpenInNewTab}
                    variant="outline"
                    size="sm"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {t("openInNewTab")}
                  </Button>
                  <Button
                    onClick={handleDownload}
                    variant="outline"
                    size="sm"
                    disabled={isDownloading}
                  >
                    {isDownloading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    {isDownloading ? t("downloading") : t("download")}
                  </Button>
                </>
              )}
              <Button onClick={onClose} variant="secondary" size="sm">
                <X className="h-4 w-4 mr-2" />
                {t("close")}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
