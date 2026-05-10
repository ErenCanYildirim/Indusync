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
import {
  Download,
  X,
  FileText,
  Image,
  File,
  AlertCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { CompanyDocument } from "@/lib/api/types";
import { companyApi } from "@/lib/api/company";
import { useTranslations } from "next-intl";
import { toast } from "@/components/ui/use-toast";

interface DocumentViewerProps {
  document: CompanyDocument | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentViewer({
  document,
  isOpen,
  onClose,
}: DocumentViewerProps) {
  const t = useTranslations("Profile.companyDocuments");
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Reset state when document changes or dialog closes
  useEffect(() => {
    if (!isOpen || !document) {
      setDocumentUrl(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    // Use the document URL directly if available
    if (document.url) {
      setDocumentUrl(document.url);
      setIsLoading(false);
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
      // Try to get secure download URL if the document doesn't have a direct URL
      const url = await companyApi.getDocumentDownloadUrl(document.id);
      setDocumentUrl(url);
    } catch (err) {
      console.error("Error loading document URL:", err);
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
      link.download = document.name;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: t("actions.downloadSuccess"),
        description: `${document.name} ${t(
          "actions.downloadSuccessDescription"
        )}`,
      });
    } catch (err) {
      console.error("Error downloading document:", err);
      toast({
        title: t("error.downloadFailed"),
        description: t("error.downloadFailedDescription"),
        variant: "destructive",
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

  const getDocumentIcon = (contentType?: string) => {
    if (!contentType) return FileText;

    if (contentType.startsWith("image/")) return Image;
    if (contentType.includes("pdf")) return FileText;
    return File;
  };

  const isImageDocument = (contentType?: string) => {
    return contentType?.startsWith("image/");
  };

  const isPdfDocument = (contentType?: string) => {
    return contentType?.includes("pdf");
  };

  const canPreview = (contentType?: string) => {
    return isImageDocument(contentType) || isPdfDocument(contentType);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round((bytes / Math.pow(1024, i)) * 100) / 100} ${sizes[i]}`;
  };

  if (!document) return null;

  const IconComponent = getDocumentIcon(document.contentType);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-left">
            <IconComponent className="h-5 w-5" />
            {document.name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-96 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin" />
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
                {t("actions.retryLoad")}
              </Button>
            </div>
          )}

          {documentUrl && !isLoading && !error && (
            <div className="h-full overflow-auto">
              {canPreview(document.contentType) ? (
                <div className="w-full h-full min-h-96">
                  {isImageDocument(document.contentType) ? (
                    <div className="flex justify-center p-4">
                      <img
                        src={documentUrl}
                        alt={document.name}
                        className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                        onError={() => setError(t("error.fileNotFound"))}
                      />
                    </div>
                  ) : isPdfDocument(document.contentType) ? (
                    <iframe
                      src={documentUrl}
                      className="w-full h-full min-h-96 border-0 rounded-lg"
                      title={document.name}
                      onError={() => setError(t("error.fileNotFound"))}
                    />
                  ) : null}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-96 space-y-4">
                  <IconComponent className="h-16 w-16 text-muted-foreground" />
                  <div className="text-center space-y-2">
                    <p className="font-medium">{document.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("previewNotAvailable")}
                    </p>
                    {document.fileSize && (
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(document.fileSize)}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleOpenInNewTab} variant="outline">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      {t("actions.openInNewTab")}
                    </Button>
                    <Button onClick={handleDownload} disabled={isDownloading}>
                      {isDownloading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      {isDownloading
                        ? t("actions.downloading")
                        : t("actions.download")}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex-shrink-0">
          <div className="flex justify-between items-center w-full">
            <div className="text-sm text-muted-foreground">
              {document.contentType && (
                <span className="uppercase mr-4">
                  {document.contentType.split("/")[1]}
                </span>
              )}
              {document.fileSize && (
                <span>{formatFileSize(document.fileSize)}</span>
              )}
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
                    {t("actions.openInNewTab")}
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
                    {isDownloading
                      ? t("actions.downloading")
                      : t("actions.download")}
                  </Button>
                </>
              )}
              <Button onClick={onClose} variant="secondary" size="sm">
                <X className="h-4 w-4 mr-2" />
                {t("actions.close")}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
