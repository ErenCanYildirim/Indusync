"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Upload,
  Trash2,
  Eye,
  Download,
  AlertCircle,
  CheckCircle,
  Calendar,
  HardDrive,
  Shield,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { useLocale } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useTermsConditions } from "@/hooks/use-terms-conditions";
import {
  TermsConditionsDocument,
  formatFileSize,
} from "@/lib/types/terms-conditions";
import TermsConditionsUploadSimple from "./terms-conditions-upload-simple";

interface TermsConditionsCardProps {
  companyId: string;
  companyName?: string;
}

export function TermsConditionsCardFixed({
  companyId,
  companyName = "",
}: TermsConditionsCardProps) {
  console.log("TermsConditionsCardFixed rendering with companyId:", companyId);

  // Local state for UI interactions
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showViewer, setShowViewer] = useState(false);

  // Translations with error handling
  let t: any, tCommon: any, locale: string;
  try {
    t = useTranslations("Dashboard.companyProfile.termsConditions");
    tCommon = useTranslations("Common");
    locale = useLocale();
  } catch (error) {
    console.error("Translation error:", error);
    // Fallback translations
    t = (key: string) => key;
    tCommon = (key: string) => key;
    locale = "en";
  }

  // T&C hook for data management with error handling
  let hookData;
  try {
    hookData = useTermsConditions(companyId);
    console.log("useTermsConditions hook result:", hookData);
  } catch (error) {
    console.error("Error in useTermsConditions hook:", error);
    // Fallback values
    hookData = {
      document: null,
      hasDocument: false,
      isLoading: false,
      isUploading: false,
      isDeleting: false,
      isError: true,
      error: error as Error,
      uploadDocument: async () => {
        throw new Error("Hook failed");
      },
      deleteDocument: async () => {
        throw new Error("Hook failed");
      },
      refetch: () => {},
    };
  }

  const {
    document,
    hasDocument,
    isLoading,
    isUploading,
    isDeleting,
    isError,
    error,
    uploadDocument,
    deleteDocument,
    refetch,
  } = hookData;

  const formatDate = (dateString: string) => {
    try {
      return format(
        new Date(dateString),
        locale === "en" ? "MM/dd/yyyy" : "dd.MM.yyyy",
        {
          locale: locale === "en" ? enUS : de,
        }
      );
    } catch (error) {
      return dateString; // Fallback to original string
    }
  };

  const handleUploadComplete = async (
    uploadedDocument: TermsConditionsDocument
  ) => {
    try {
      setShowUploadDialog(false);
      toast.success(t("uploadSuccess"), {
        description: t("uploadSuccessDescription", {
          fileName: uploadedDocument.originalFileName,
        }),
      });
      refetch();
    } catch (err) {
      console.error("Error handling upload completion:", err);
    }
  };

  const handleUploadError = (errorMessage: string) => {
    toast.error(t("uploadError"), {
      description: errorMessage,
    });
  };

  const handleDelete = async () => {
    try {
      await deleteDocument();
      setShowDeleteDialog(false);
      toast.success(t("deleteSuccess"), {
        description: t("deleteSuccessDescription"),
      });
    } catch (err) {
      console.error("Error deleting T&C document:", err);
      toast.error(t("deleteError"), {
        description:
          err instanceof Error ? err.message : t("deleteErrorDescription"),
      });
    }
  };

  const handleView = () => {
    setShowViewer(true);
  };

  const handleDownload = async () => {
    if (!document) return;

    try {
      const link = window.document.createElement("a");
      link.href = document.url;
      link.download = document.originalFileName || document.fileName;
      link.target = "_blank";
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      toast.success(t("downloadSuccess"), {
        description: t("downloadSuccessDescription", {
          fileName: document.originalFileName || document.fileName,
        }),
      });
    } catch (err) {
      console.error("Error downloading T&C document:", err);
      toast.error(t("downloadError"), {
        description: t("downloadErrorDescription"),
      });
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            {t("title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-600">
                  {tCommon("status.loading")}
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {isError && error && !isLoading && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {t("error.loadFailed")}: {error.message}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={refetch}
                  className="ml-2"
                >
                  {t("retry")}
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* No Document State */}
          {!isLoading && !isError && !hasDocument && (
            <div className="text-center py-8 space-y-4">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-gray-900">
                  {t("noDocument.title")}
                </h3>
                <p className="text-sm text-gray-600 max-w-sm mx-auto">
                  {t("noDocument.description")}
                </p>
              </div>
              <Button
                type="button"
                onClick={() => setShowUploadDialog(true)}
                disabled={isUploading}
                className="mt-4"
              >
                <Upload className="h-4 w-4 mr-2" />
                {t("uploadDocument")}
              </Button>
            </div>
          )}

          {/* Document Exists State */}
          {!isLoading && !isError && hasDocument && document && (
            <div className="space-y-4">
              {/* Document Info Card */}
              <div className="border rounded-lg p-4 bg-green-50 border-green-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <FileText className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {document.originalFileName || document.fileName}
                        </h4>
                        <Badge variant="outline" className="text-xs">
                          <Shield className="h-3 w-3 mr-1" />
                          {t("active")}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {t("uploaded")}: {formatDate(document.uploadedAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <HardDrive className="h-3 w-3" />
                          {formatFileSize(document.fileSize)}
                        </span>
                        {document.version > 1 && (
                          <Badge variant="outline" className="text-xs">
                            {t("version")} {document.version}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleView}
                  className="flex-1 sm:flex-none"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {t("viewDocument")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="flex-1 sm:flex-none"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {tCommon("actions.download")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUploadDialog(true)}
                  disabled={isUploading}
                  className="flex-1 sm:flex-none"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {t("replaceDocument")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={isDeleting}
                  className="flex-1 sm:flex-none text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {tCommon("actions.delete")}
                </Button>
              </div>

              {/* Upload Status */}
              {isUploading && (
                <Alert>
                  <Upload className="h-4 w-4" />
                  <AlertDescription>{t("uploading")}...</AlertDescription>
                </Alert>
              )}

              {/* Delete Status */}
              {isDeleting && (
                <Alert>
                  <Trash2 className="h-4 w-4" />
                  <AlertDescription>{t("deleting")}...</AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Info Section */}
          <div className="border-t pt-4">
            <div className="space-y-3 text-xs text-gray-600">
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t("info.fileFormat")}</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t("info.maxFileSize")}</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t("info.visibility")}</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t("info.auditLog")}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {hasDocument ? t("replaceDocument") : t("uploadDocument")}
            </DialogTitle>
            <DialogDescription>
              {hasDocument
                ? t("replaceDocumentDescription")
                : t("uploadDocumentDescription")}
            </DialogDescription>
          </DialogHeader>
          <TermsConditionsUploadSimple
            onUploadComplete={handleUploadComplete}
            onUploadError={handleUploadError}
            disabled={isUploading}
            companyId={companyId}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deleteConfirmation.title")}</DialogTitle>
            <DialogDescription>
              {t("deleteConfirmation.description")}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {t("deleteConfirmation.warning")}
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              {tCommon("actions.cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? t("deleting") : tCommon("actions.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default TermsConditionsCardFixed;
